import { Pipe } from "@angular/core";
import { DatePickerMonth } from "../defines/date-range-picker.define";

@Pipe({
  name: 'DatePickerGetMonthNamePipe',
  standalone: true,
})

export class DatePickerGetMonthNamePipe {
  public transform(monthNumber: number): string {
    const month = DatePickerMonth().find(m => m.value === monthNumber);
    return month ? month.label : '';
  }
}
