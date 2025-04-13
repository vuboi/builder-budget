// date-range-picker.component.ts
import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, effect, ElementRef, HostListener, input, output, signal } from '@angular/core';
import { IDateRangePicker } from '../../interfaces/date-range-picker.interface';
import { DatePickerMonth } from './defines/date-range-picker.define';
import { DatePickerFormatPipe } from './pipes/format-date.pipe';
import { DatePickerGetMonthNamePipe } from './pipes/get-month-name.pipe';
import { DatePickerGetStyleButtonDatePipe } from './pipes/get-style-button-date.pipe';

@Component({
  selector: 'app-date-range-picker',
  standalone: true,
  imports: [
    CommonModule,
    DatePickerFormatPipe,
    DatePickerGetMonthNamePipe,
    DatePickerGetStyleButtonDatePipe
  ],
  templateUrl: './date-range-picker.component.html',
  styleUrls: ['./date-range-picker.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class DateRangePickerComponent {
  public dateRange = input<IDateRangePicker>({
    start: new Date(new Date().getFullYear(), 0, 1),
    end: new Date(new Date().getFullYear(), 11, 31)
  });

  public isOpen = signal<boolean>(false);
  public selectedYear = signal<number>(new Date().getFullYear());
  public selectedStartMonth = signal<number>(0);
  public selectedEndMonth = signal<number>(11);
  public selectionInProgress = signal<boolean>(false);
  public readonly months = DatePickerMonth();

  public selectedDateRange = output<IDateRangePicker>();

  constructor(private elementRef: ElementRef) {
    effect(() => {
      const range = this.dateRange();
      this.selectedYear.set(range.start.getFullYear());
      this.selectedStartMonth.set(range.start.getMonth());
      this.selectedEndMonth.set(range.end.getMonth());
    });
  }

  @HostListener('document:click', ['$event'])
  public onClickOutside(event: MouseEvent): void {
    if (this.isOpen() && !this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen.set(false);
    }
  }

  public handlerOpenPicker(event: MouseEvent): void {
    event.stopPropagation();
    this.isOpen.set(true);

    const range = this.dateRange();
    this.selectedYear.set(range.start.getFullYear());
    this.selectedStartMonth.set(range.start.getMonth());
    this.selectedEndMonth.set(range.end.getMonth());
    this.selectionInProgress.set(false);
  }

  public handlerSelectMonth(month: number): void {
    if (this.isMonthDisabled(month)) {
      return;
    }

    if (!this.selectionInProgress()) {
      this.selectedStartMonth.set(month);
      this.selectedEndMonth.set(month);
      this.selectionInProgress.set(true);

      return;
    }

    const setStartEndMonth = () => {
      if (month < this.selectedStartMonth()) {
        this.selectedStartMonth.set(month);
        return;
      }

      this.selectedEndMonth.set(month);
    }

    setStartEndMonth();
    this.selectionInProgress.set(false);
  }

  public isMonthDisabled(month: number): boolean {
    if (!this.selectionInProgress()) {
      return false;
    }

    const currentStart = this.selectedStartMonth();
    if (month < currentStart) {
      return (currentStart - month) > 11;
    }

    return (month - currentStart) > 11;
  }

  public handlerNextYear(): void {
    this.selectedYear.update(year => year + 1);
  }

  public handlerPrevYear(): void {
    this.selectedYear.update(year => year - 1);
  }

  public handlerCancelPicker(): void {
    this.isOpen.set(false);
  }

  public handlerApplyPicker(): void {
    const newRange: IDateRangePicker = {
      start: new Date(this.selectedYear(), this.selectedStartMonth(), 1),
      end: new Date(this.selectedYear(), this.selectedEndMonth(),
        new Date(this.selectedYear(), this.selectedEndMonth() + 1, 0).getDate())
    };

    this.selectedDateRange.emit(newRange);
    this.isOpen.set(false);
  }
}
