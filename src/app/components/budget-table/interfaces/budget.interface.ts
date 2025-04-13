import { WritableSignal } from "@angular/core";

export interface ICategoryBudget {
  id: string;
  budget_name: string;
  budget_amount: number;
}

export interface ICategoryTotal {
  id: string;
  budget_name: string;
  budget_total: number;
}

export interface ICategoryChild {
  id: string;
  category_child_name: string;
  category_budgets: WritableSignal<Array<WritableSignal<ICategoryBudget>>>;
}

export interface ICategoryParent {
  id: string;
  category_parent_name: string;
  category_children: WritableSignal<Array<WritableSignal<ICategoryChild>>>;
}

export interface ICategoryType {
  id: string;
  category_type: string;
  categories: WritableSignal<Array<WritableSignal<ICategoryParent>>>;
  category_parent_label_total: string;
}

export interface ICategoryMonth {
  origin: Date,
  index: string
}

export interface ICategorySubsTotal {
  id: string;
  category_type: string;
  category_parent_name: string;
  category_subs_total: ICategoryTotal[];
}

export interface ICategoryTypeTotal {
  categoryType: string;
  categoryTotal: Record<string, number>;
}

export interface ICategoryBalance {
  opening_balance: Record<string, number>;
  closing_balance: Record<string, number>;
}

export interface IContextMenu {
  show: boolean;
  x: number;
  y: number;
  cateBudget?: WritableSignal<ICategoryBudget>;
  cateChild?: WritableSignal<ICategoryChild>;
  cateParent?: WritableSignal<ICategoryParent>;
}
