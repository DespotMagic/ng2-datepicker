import {DatepickerOptions} from '../ng-datepicker/ng-datepicker.component';

import { Component, OnInit, OnChanges, Input, Output, SimpleChanges, HostListener, forwardRef, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';

import * as moment from 'moment';
const Moment: any = (<any>moment).default || moment;

export interface DateInputOptions {
	minDate?: string | Date;
	maxDate?: string | Date;
	format?: string; // default: 'MMM D[,] YYYY'
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

	private date?: moment.Moment;

	private disabled: boolean = false;

	private datepickerOptions: DatepickerOptions;
	private isDialogOpen = false;
	private inputText;


	private minDate: moment.Moment;
	private maxDate: moment.Moment;

	private format: string = 'MM/YYYY';
	private defaultFormat = 'MM/YYYY'

	constructor() {
		this.options = this.options || {};
	}

	ngOnInit() {
		this.setOptions();
	}

	get value(): moment.Moment {
		return this.date;
	}

	set value(val: moment.Moment) {
		this.date = val;
		let result = this.date ? this.date.format() : null;
		this.onChangeCallback(result);
	}
	
	ngOnChanges(changes: SimpleChanges) {

		if ('options' in changes && !changes['options'].firstChange) {
			this.setOptions();
		}

		if ('mode' in changes && !changes['mode'].firstChange) {
			this.setOptions();
		}

	}

	setOptions(): void {
		const today = new Date();

		if (this.options.minDate && Moment(this.options.minDate).isValid()) 
		{
			this.minDate = Moment(this.options.minDate);
		} else {
			this.minDate = null;
		}

		if (this.options.maxDate && Moment(this.options.maxDate).isValid()) {
			this.maxDate = Moment(this.options.maxDate);
		} else {
			this.maxDate = null;
		}

		this.mode = this.mode || this.options.mode || 'months';

		switch (this.mode) {
			case 'days': {
				this.defaultFormat = 'DD/MM/YYYY';
				break;
			}
			case 'years': {
				this.defaultFormat = 'YYYY';
				break;
			}
			case 'months': default: {
				this.defaultFormat = 'MM/YYYY';
				break;
			}
		}	
		this.format = this.options.format || this.defaultFormat;

		this.datepickerOptions = {
			minView: this.mode,
		};

		this.updateInputText();
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

	setInputText(date) {
		this.inputText = date ? date.format(this.format) : '';
	}

	updateInputText() {
		this.setInputText(this.date);
	}

	onChaneDataFromDialog(newDate) {
		this.setInputText(newDate);

		// TODO: validate
		this.value = newDate;
	}

	writeValue(val: Date | string): void {

		if (Moment(val).isValid()) {
			this.date = Moment(val);
			this.setInputText(this.date);
		} else {
			this.date = null;
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
