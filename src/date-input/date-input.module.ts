import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateInputComponent } from './date-input.component';
import { NgDatepickerModule } from '../ng-datepicker';

@NgModule({
	declarations: [DateInputComponent],
	imports: [CommonModule, FormsModule, NgDatepickerModule],
	exports: [DateInputComponent, CommonModule, FormsModule]
})
export class DateInputModule { }
