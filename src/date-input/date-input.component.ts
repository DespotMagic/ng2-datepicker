import {DatepickerOptions} from '../ng-datepicker/ng-datepicker.component';
import * as enLocale from 'date-fns/locale/en';

import { Component, OnInit, Input, Output, OnChanges, SimpleChanges, HostListener, forwardRef, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';


import {
	startOfMonth,
	endOfMonth,
	addMonths,
	subMonths,
	addYears,
	subYears,
	setYear,
	eachDay,
	getDate,
	getMonth,
	getYear,
	isToday,
	isSameDay,
	isSameMonth,
	isSameYear,
	format,
	getDay,
	subDays,
	setDay
} from 'date-fns';

@Component({
	selector: 'date-input',
	templateUrl: 'date-input.component.html',
	//styleUrls: ['date-input.component'],
	providers: [
		{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DateInputComponent), multi: true }
	]
})
export class DateInputComponent implements ControlValueAccessor, OnInit {

	@Input() mode: 'days' | 'months' | 'years';

	@Input() options: any;

	private date: Date;

	private datepickerOptions: DatepickerOptions;
	private isDialogOpen = false;
	private inputText;

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
		if ('selectMode' in changes) {
			this.setOptions();
		}

	}

	setOptions(): void {

		this.datepickerOptions = {
			locale: enLocale,
			minView: this.mode,
			minYear: this.options && this.options.minYear,
			maxYear: this.options && this.options.maxYear
		}

	}

	openDialog() {
		this.isDialogOpen = true;
	}

	dialogClosed () {
		this.isDialogOpen = false;
	}

	setInputDate(date) {
		this.inputText = format(date, 'MM/YYYY')
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

	private onTouchedCallback: () => void = () => { };
	private onChangeCallback: (_: any) => void = () => { };

	registerOnChange(fn: any) {
		this.onChangeCallback = fn;
	}

	registerOnTouched(fn: any) {
		this.onTouchedCallback = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		throw new Error('Method not implemented.');
	}
	
}
