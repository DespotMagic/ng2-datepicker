import {DatepickerOptions} from '../ng-datepicker/ng-datepicker.component';
import * as enLocale from 'date-fns/locale/en';

import { Component, OnInit, OnChanges, Input, Output, SimpleChanges, HostListener, forwardRef, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';


import {
	//startOfMonth,
	//endOfMonth,
	//addMonths,
	//subMonths,
	addYears,
	//subYears,
	//setYear,
	//eachDay,
	//getDate,
	//getMonth,
	getYear,
	//isToday,
	//isSameDay,
	//isSameMonth,
	//isSameYear,
	format,
	//getDay,
	//subDays,
	//setDay,

	parse,
	isValid
} from 'date-fns';


export interface DateInputOptions {
	minDate?: string;
	maxDate?: string;
	displayFormat?: string; // default: 'MMM D[,] YYYY'
	mode?: 'days' | 'months' | 'years';
}

@Component({
	selector: 'date-input',
	templateUrl: 'date-input.component.html',
	styleUrls: ['date-input.component.scss'],
	providers: [
		{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateInputComponent), multi: true }
	]
})
export class DateInputComponent implements ControlValueAccessor, OnInit, OnChanges {

	@Input() mode?: 'days' | 'months' | 'years';

	@Input() options?: DateInputOptions;

	private date: Date;
	private disabled: boolean = false;

	private datepickerOptions: DatepickerOptions;
	private isDialogOpen = false;
	private inputText;


	private minDate: Date;
	private maxDate: Date;
	private displayFormat: string = 'MM/YYYY';

	constructor() {

	}

	ngOnInit() {
		this.setOptions();
	}

	get value(): Date {
		return this.date;
	}

	set value(val: Date) {
		this.date = val;
		this.onChangeCallback(this.date);
	}
	
	ngOnChanges(changes: SimpleChanges) {
		if ('mode' in changes || 'options' in changes) {
			this.setOptions();
		}
	}

	setOptions(): void {
		const today = new Date();

		this.minDate = this.options && this.options.minDate && parse(this.options.minDate);
		if (!this.minDate || !isValid(this.minDate)) {
			this.minDate = new Date(1900, 0);
		}

		this.maxDate = this.options && this.options.maxDate && parse(this.options.maxDate);
		if (!this.maxDate || !isValid(this.maxDate)) {
			this.maxDate = addYears(today, 1000);
		}

		this.displayFormat = this.options && this.options.displayFormat || 'MM/YYYY';

		this.mode = this.mode || this.options && this.options.mode || 'days';

		this.datepickerOptions = {
			locale: enLocale,
			minView: this.mode,

			//minYear: getYear(this.minDate),
			//maxYear: getYear(this.maxDate),
		};
	}

	openDialog() {
		if (this.disabled) {
			return;
		}
		this.isDialogOpen = true;
	}

	dialogClosed () {
		this.isDialogOpen = false;
	}

	setInputDate(date) {
		this.inputText = format(date, this.displayFormat)
	}

	onChaneDataFromDialog(newDate) {
		this.date = newDate;
		this.setInputDate(newDate);

		// TODO: validate
		this.value = newDate;
	}


	writeValue(val: Date): void {

		this.date = val;
		this.value = val;

		if (val) {
			this.setInputDate(val);
		}
	}

	setDisabledState(isDisabled: boolean): void {
		this.disabled = isDisabled;
		if (this.disabled) {
			this.isDialogOpen = false;
		}
     }

	private onTouchedCallback: () => void = () => { };
	private onChangeCallback: (_: any) => void = () => { };

	registerOnChange(fn: any) {
		this.onChangeCallback = fn;
	}

	registerOnTouched(fn: any) {
		this.onTouchedCallback = fn;
	}

	
}
