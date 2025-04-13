import { CommonModule } from "@angular/common";
import { AfterViewInit, ChangeDetectionStrategy, Component, computed, ElementRef, inject, signal, WritableSignal } from "@angular/core";
import { FormsModule } from "@angular/forms";
import { DateRangePickerComponent } from "../../shared/components/date-range-picker/date-range-picker.component";
import { TableNavigationDirective } from "../../shared/directives/table-navigate.directive";
import { uuid } from "../../shared/helpers/common";
import { IDateRangePicker } from "../../shared/interfaces/date-range-picker.interface";
import { ICategoryBalance, ICategoryBudget, ICategoryChild, ICategoryMonth, ICategoryParent, ICategorySubsTotal, ICategoryTotal, ICategoryType, ICategoryTypeTotal, IContextMenu } from "./interfaces/budget.interface";

@Component({
  selector: "app-budget-table",
  templateUrl: "./budget-table.component.html",
  styleUrls: ["./budget-table.component.scss"],
  imports: [
    CommonModule,
    FormsModule,
    TableNavigationDirective,
    DateRangePickerComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class BudgetTableComponent implements AfterViewInit {
  private element = inject(ElementRef);

  public dateRange = signal<{ start: Date; end: Date }>({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(new Date().getFullYear(), 11, 31)
  });

  public months = computed(() => {
    const months: ICategoryMonth[] = [];
    const start = this.dateRange().start;
    const end = this.dateRange().end;
    const current = new Date(start);
    while (current <= end) {
      months.push({
        origin: new Date(current),
        index: current.toLocaleString("default", { month: "long" }),
      });
      current.setMonth(current.getMonth() + 1);
    }

    return months;
  })

  public titleDateRange = computed(() => {
    const start = this.dateRange().start;
    const end = this.dateRange().end;

    return `Start ${start.toLocaleString("default", { month: "long" })} ${start.getFullYear()} To ${end.toLocaleString("default", { month: "long" })} ${end.getFullYear()}`;
  })

  public categorySubsTotal = computed(() => {
    const totals: ICategorySubsTotal[] = [];
    for (const cateType of this.categoryTypes()) {
      for (const cateParent of cateType.categories()) {
        const cateBudgets = cateParent().category_children().flatMap(cateChild => cateChild().category_budgets());
        const budgetSubTotal = cateBudgets.reduce((acc, cateBudget) => {
          const budgetName = cateBudget().budget_name;
          const budgetAmount = cateBudget().budget_amount;
          if (!acc[budgetName]) {
            acc[budgetName] = { id: uuid(), budget_name: budgetName, budget_total: 0 };
          }
          acc[budgetName].budget_total += budgetAmount;
          return acc;
        }, {} as Record<string, ICategoryTotal>);

        totals.push({
          id: cateParent().id,
          category_type: cateType.category_type,
          category_parent_name: cateParent().category_parent_name,
          category_subs_total: Object.values(budgetSubTotal)
        });
      }
    }

    return totals;
  })

  public categoryTypeTotal = computed(() => {
    const groupByType = this.categorySubsTotal().reduce((acc, cate) => {
      acc[cate.category_type] = acc[cate.category_type] || [];
      acc[cate.category_type].push(...cate.category_subs_total);
      return acc;
    }, {} as Record<string, ICategoryTotal[]>);

    const categoryTypeTotal: ICategoryTypeTotal[] = [];
    for (const [categoryType, categoryTotals] of Object.entries(groupByType)) {
      const categoryTotal = categoryTotals.reduce((acc, cate) => {
        acc[cate.budget_name] = (acc[cate.budget_name] || 0) + cate.budget_total;
        return acc;
      }, {} as Record<string, number>);
      categoryTypeTotal.push({ categoryType, categoryTotal });
    }

    return categoryTypeTotal;
  })

  public categoryProfitLost = computed(() => {
    const incomeValues = this.categoryTypeTotal().find(cate => cate.categoryType === 'Income')?.categoryTotal || {};
    const expensesValues = this.categoryTypeTotal().find(cate => cate.categoryType === 'Expenses')?.categoryTotal || {};
    return this.months().reduce((acc, month) => {
      acc[month.index] = (incomeValues[month.index] || 0) - (expensesValues[month.index] || 0);
      return acc;
    }, {} as Record<string, number>);
  });

  public balanceBudget = computed(() => {
    const results: ICategoryBalance = { opening_balance: {}, closing_balance: {} };
    const setOpeningBalance = (monthKey: string, index: number) => {
      // Default set opening_balance to 0 with first month, next month opening_balance = closing_balance of previous month
      if (index === 0) {
        results.opening_balance[monthKey] = 0;
        return;
      }

      const previousMonthKey = this.months()[index - 1].index;
      results.opening_balance[monthKey] = results.closing_balance[previousMonthKey] || 0;
    }

    this.months().forEach((month, i) => {
      setOpeningBalance(month.index, i);
      // Calculate closing_balance = opening_balance + profit/loss current month
      results.closing_balance[month.index] = results.opening_balance[month.index] + (this.categoryProfitLost()[month.index] || 0);
    })

    return results;
  })

  public categoryTypes = signal<ICategoryType[]>(this.initCategory())
  public contextMenu = signal<IContextMenu>({ show: false, x: 0, y: 0 });

  constructor() { }

  public handlerBudgetChange(amount: number, categoryBudget: WritableSignal<ICategoryBudget>): void {
    categoryBudget.update(value => ({ ...value, budget_amount: amount }))
  }

  public handlerAddCategoryChild(event: KeyboardEvent, categoryParent: ICategoryParent): void {
    if (event.key !== 'Enter') {
      return;
    }

    const inputNewCateChild = this.getElementByAttr(`add-new-cate-child="${categoryParent.id}"`);
    const newCategoryBudgets: Array<WritableSignal<ICategoryBudget>> = this.months().map(month => signal<ICategoryBudget>({
      id: uuid(),
      budget_name: month.index,
      budget_amount: 0,
    }))

    const newChildCategory: WritableSignal<ICategoryChild> = signal({
      id: uuid(),
      category_child_name: inputNewCateChild?.value || '',
      category_budgets: signal(newCategoryBudgets)
    });

    categoryParent.category_children.update((prev) => [...prev, newChildCategory]);

    if (inputNewCateChild) {
      inputNewCateChild.value = '';
    }

    const firstCategoryBudget = newCategoryBudgets[0]();
    setTimeout(() => {
      inputNewCateChild?.blur();
      const inputCategoryBudget = this.getElementByAttr(`category-budget-id="${firstCategoryBudget.id}"`);
      inputCategoryBudget?.focus();
    });
  }

  public handlerAddCategoryParent(event: KeyboardEvent, cateType: ICategoryType): void {
    if (event.key !== 'Enter') {
      return;
    }

    const inputNewCateParent = this.getElementByAttr(`add-new-cate-parent="${cateType.id}"`);
    const newCateParent: ICategoryParent = {
      id: uuid(),
      category_parent_name: inputNewCateParent?.value || '',
      category_children: signal<Array<WritableSignal<ICategoryChild>>>([]),
    }

    for (const category of this.categoryTypes()) {
      if (category.id === cateType.id) {
        category.categories.update((prev) => [...prev, signal(newCateParent)]);
      }
    }

    if (inputNewCateParent) {
      inputNewCateParent.value = '';
    }

    setTimeout(() => {
      inputNewCateParent?.blur();
      const inputNewCateChild = this.getElementByAttr(`add-new-cate-child="${newCateParent.id}"`);
      inputNewCateChild?.focus();
    },);
  }

  private getElementByAttr(attr: string): HTMLInputElement | null {
    return this.element.nativeElement.querySelector(`[${attr}]`);
  }

  private getElementById(id: string): HTMLInputElement | null {
    return this.element.nativeElement.querySelector(`#${id}`);
  }

  public handlerApplyToAll(): void {
    const { cateBudget, cateChild, cateParent } = this.contextMenu() || {};
    if (!cateBudget || !cateChild || !cateParent) {
      return;
    }

    cateParent().category_children().forEach(cate => {
      if (cate().id !== cateChild().id) {
        return;
      }

      cate().category_budgets.update((prev) => prev.map(budget => signal<ICategoryBudget>({
        id: budget().id,
        budget_name: budget().budget_name,
        budget_amount: cateBudget().budget_amount || 0
      })));
    });

    this.contextMenu.update(value => ({ ...value, show: false }));
  }

  public handlerDeleteRow(): void {
    const { cateParent, cateChild } = this.contextMenu() || {};
    if (!cateParent || !cateChild) {
      return;
    }

    cateParent().category_children.update((prev) => prev.filter(cate => cate().id !== cateChild().id));
    this.contextMenu.update(value => ({ ...value, show: false }));
  }

  public handlerOpenContextMenu(
    event: MouseEvent,
    cateBudget: WritableSignal<ICategoryBudget>,
    cateChild: WritableSignal<ICategoryChild>,
    cateParent: WritableSignal<ICategoryParent>
  ): void {
    event.preventDefault();
    this.contextMenu.set({ show: true, x: event.clientX, y: event.clientY, cateBudget, cateChild, cateParent });
  }

  public handlerChangeDatePicker(range: IDateRangePicker): void {
    this.dateRange.set(range);
    this.categoryTypes.set(this.initCategory());
  }

  public formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }

  private initCategory(): ICategoryType[] {
    return [
      {
        id: uuid(),
        category_type: 'Income',
        categories: signal<Array<WritableSignal<ICategoryParent>>>([]),
        category_parent_label_total: 'Total Income',
      },
      {
        id: uuid(),
        category_type: 'Expenses',
        categories: signal<Array<WritableSignal<ICategoryParent>>>([]),
        category_parent_label_total: 'Total Expenses',
      }
    ]
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      const inputNewCateParent = this.getElementById('add-new-cate-parent');
      inputNewCateParent?.focus();
    });
  }
}
