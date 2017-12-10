import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DateInputComponent } from './date-input.component';
import { NgDatepickerModule } from '../ng-datepicker';

import { TextMaskModule } from 'angular2-text-mask';

@NgModule({
	declarations: [DateInputComponent],
	imports: [CommonModule, FormsModule, NgDatepickerModule, TextMaskModule],
	exports: [DateInputComponent, CommonModule, FormsModule]
})
export class DateInputModule { }
