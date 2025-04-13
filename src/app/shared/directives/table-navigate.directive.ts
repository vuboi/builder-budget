import { Directive, ElementRef, inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';

@Directive({
  selector: '[TableNavigationDirective]',
  standalone: true
})

export class TableNavigationDirective implements OnInit, OnDestroy {
  private removeListener: Function | null = null;
  private el = inject(ElementRef);
  private renderer = inject(Renderer2);

  constructor() { }

  ngOnInit(): void {
    if (this.el.nativeElement.tagName !== 'TABLE') {
      return;
    };
    this.removeListener = this.renderer.listen(this.el.nativeElement, 'keydown', this.handleKeyDown.bind(this));
  }

  ngOnDestroy(): void {
    if (this.removeListener) {
      this.removeListener();
    }
  }

  private handleKeyDown(event: KeyboardEvent): void {
    if (!['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
      return;
    }

    const currentElement = document.activeElement as HTMLElement;
    if (!currentElement || !this.el.nativeElement.contains(currentElement)) {
      return;
    }

    const currentCell = currentElement.closest('td');
    if (!currentCell) {
      return;
    }

    const currentRow = currentCell.closest('tr');
    if (!currentRow) {
      return;
    }

    event.preventDefault();
    const nextCell = this.getNextCell(currentRow, currentCell, event.key);
    if (nextCell) {
      this.focusElement(nextCell)
    };
  }

  private getNextCell(row: HTMLTableRowElement, cell: HTMLTableCellElement, key: string): HTMLTableCellElement | null {
    const table = this.el.nativeElement as HTMLTableElement;
    const rows = Array.from(table.rows);
    const rowIndex = rows.indexOf(row);
    const cells = Array.from(row.cells);
    const cellIndex = cells.indexOf(cell);

    switch (key) {
      case 'ArrowLeft':
        if (cellIndex > 0) {
          return cells[cellIndex - 1] as HTMLTableCellElement
        };
        if (rowIndex > 0) {
          const prevCells = Array.from(rows[rowIndex - 1].cells);
          return prevCells.length ? prevCells[prevCells.length - 1] as HTMLTableCellElement : null;
        }
        break;

      case 'ArrowRight':
        if (cellIndex < cells.length - 1) {
          return cells[cellIndex + 1] as HTMLTableCellElement
        };
        if (rowIndex < rows.length - 1) {
          const nextCells = Array.from(rows[rowIndex + 1].cells);
          return nextCells.length ? nextCells[0] as HTMLTableCellElement : null;
        }
        break;

      case 'ArrowUp':
        if (rowIndex > 0) {
          const prevCells = Array.from(rows[rowIndex - 1].cells);
          return prevCells.length ? prevCells[Math.min(cellIndex, prevCells.length - 1)] as HTMLTableCellElement : null;
        }
        break;

      case 'ArrowDown':
        if (rowIndex < rows.length - 1) {
          const nextCells = Array.from(rows[rowIndex + 1].cells);
          return nextCells.length ? nextCells[Math.min(cellIndex, nextCells.length - 1)] as HTMLTableCellElement : null;
        }
        break;
    }

    return null;
  }

  private focusElement(cell: HTMLTableCellElement): void {
    const focusable = cell.querySelector('input:not([disabled]), textarea:not([disabled]), select:not([disabled]), button:not([disabled]), [contenteditable="true"]') as HTMLElement;

    if (focusable) {
      focusable.focus();

      if (['INPUT', 'TEXTAREA'].includes(focusable.tagName)) {
        const input = focusable as HTMLInputElement;

        if (!input.readOnly &&
          ['text', 'password', 'search', 'tel', 'url', 'email'].includes(input.type)) {
          input.setSelectionRange(input.value.length, input.value.length);
        }
      }
      return;
    }

    if (cell.tabIndex < 0) cell.tabIndex = 0;
    cell.focus();
  }
}
