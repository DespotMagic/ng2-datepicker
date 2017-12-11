import {DatepickerOptions} from '../ng-datepicker/ng-datepicker.component';

import { Component, OnInit, OnChanges, Input, Output, SimpleChanges, HostListener, forwardRef, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor, NG_VALIDATORS, Validator } from '@angular/forms';

import * as moment from 'moment';
const Moment: any = (<any>moment).default || moment;

export interface DateInputOptions {
	minDate?: string | Date;
	maxDate?: string | Date;
	mode?: 'days' | 'months' | 'years';
	disableTextMask?: boolean;
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


	private minDate: Date;
	private maxDate: Date;

	private format: string = 'MM/YYYY';
	private maskParams: any;

	constructor() {
		this.options = this.options || {};
		this.maskParams = {
			guide: true,
			placeholderChar: '_',
			showMask: false,
			mask: null
		};
	}

	ngOnInit() {
		this.setOptions();
	}

	get value(): moment.Moment {
		return this.date;
	}

	set value(val: moment.Moment) {
		this.date = val;
		let result = this.date ? this.date.format('YYYY-MM-DD') : null;
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
			this.minDate = Moment(this.options.minDate).toDate();
		} else {
			this.minDate = null;
		}

		if (this.options.maxDate && Moment(this.options.maxDate).isValid()) {
			this.maxDate = Moment(this.options.maxDate).toDate();
		} else {
			this.maxDate = null;
		}

		this.mode = this.mode || this.options.mode || 'months';

		switch (this.mode) {
			case 'days': {
				this.format = 'MM/DD/YYYY';
				this.maskParams.mask = [/\d/, /\d/, '/', /\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/];
				break;
			}
			case 'years': {
				this.format = 'YYYY';
				this.maskParams.mask = [/\d/, /\d/, /\d/, /\d/];
				break;
			}
			case 'months': default: {
				this.format = 'MM/YYYY';
				this.maskParams.mask = [/\d/, /\d/, '/', /\d/, /\d/, /\d/, /\d/];
				break;
			}
		}	

		if (this.options.disableTextMask) {
			this.maskParams.mask = null;
		}

		this.datepickerOptions = {
			minView: this.mode,
			minDate: this.minDate,
			maxDate: this.maxDate
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

	updateInputText() {
		this.inputText = this.date ? this.date.format(this.format) : '';
	}

	onChaneDataFromDialog(newDate) {
		this.setNewVal(newDate);
	}

	writeValue(val: Date | string): void {

		if (Moment(val).isValid()) {
			this.date = Moment(val);
			this.updateInputText();
		} else {
			this.date = null;
		}
	}

	onKey(event: any) {
		let currentDat = Moment(event.target.value, this.format, true);
		if (currentDat.isValid()) {
			this.setNewVal(currentDat);
		}
	}

	setNewVal(val: moment.Moment) {
		// TODO: validate for max and min
		this.value = val;
		this.updateInputText();
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
