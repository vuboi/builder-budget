import { Pipe } from "@angular/core";

@Pipe({
  name: 'DatePickerGetStyleButtonDatePipe',
  standalone: true,
})

export class DatePickerGetStyleButtonDatePipe {
  public transform(month: number, selectedStartMonth: number, selectedEndMonth: number, selectionInProgress: boolean): string {
    let baseClasses = 'py-2 px-2 w-full rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500';

    if (this.isMonthInRange(month, selectedStartMonth, selectedEndMonth)) {
      return `${baseClasses} bg-blue-500 text-white hover:bg-blue-600`;
    }
    if (this.isMonthDisabled(month, selectedStartMonth, selectionInProgress)) {
      return `${baseClasses} bg-gray-100 text-gray-400 cursor-not-allowed`;
    }

    return `${baseClasses} bg-gray-100 hover:bg-gray-200 text-gray-800`;
  }

  private isMonthInRange(month: number, selectedStartMonth: number, selectedEndMonth: number): boolean {
    return month >= selectedStartMonth && month <= selectedEndMonth;
  }

  public isMonthDisabled(month: number, selectedStartMonth: number, selectionInProgress: boolean): boolean {
    if (!selectionInProgress) {
      return false;
    }

    if (month < selectedStartMonth) {
      return (selectedStartMonth - month) > 11;
    }

    return (month - selectedStartMonth) > 11;
  }

}
