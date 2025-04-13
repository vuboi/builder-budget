import { Pipe } from "@angular/core";
import { DatePickerMonth } from "../defines/date-range-picker.define";

@Pipe({
  name: 'DatePickerFormatPipe',
  standalone: true,
})

export class DatePickerFormatPipe {
  public transform(date: Date): string {
    return `${this.getMonthName(date.getMonth())} ${date.getFullYear()}`;
  }

  private getMonthName(monthNumber: number): string {
    const month = DatePickerMonth().find(m => m.value === monthNumber);
    return month ? month.label : '';
  }
}
