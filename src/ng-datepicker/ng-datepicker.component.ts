import { Component, OnInit, Input, Output, OnChanges, SimpleChanges, ElementRef, HostListener, forwardRef, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import {
	startOfMonth,
	startOfYear,
	endOfMonth,
	addMonths,
	subMonths,
	addYears,
	subYears,
	setYear,
	setMonth,
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
import { ISlimScrollOptions } from 'ngx-slimscroll';

export interface DatepickerOptions {
	minYear?: number; // default: current year - 30
	maxYear?: number; // default: current year + 100
	displayFormat?: string; // default: 'MMM D[,] YYYY'
	barTitleFormat?: string; // default: 'MMMM YYYY'
	firstCalendarDay?: number; // 0 = Sunday (default), 1 = Monday, ..
	locale?: object;

	minView?: 'days' | 'months' | 'years';
}

@Component({
	selector: 'ng-datepicker',
	templateUrl: 'ng-datepicker.component.html',
	styleUrls: ['ng-datepicker.component.scss'],
	providers: [
		{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => NgDatepickerComponent), multi: true }
	]
})

export class NgDatepickerComponent implements ControlValueAccessor, OnInit, OnChanges {
	@Input() options: DatepickerOptions;

	/**
	 * Disable datepicker's input
	 */
	@Input() headless = false;

	/**
	 * Set datepicker's visibility state
	 */
	@Input() isOpened = false;

	/**
	 * Datepicker dropdown position
	 */
	@Input() position = 'bottom-right';

	/**
   *  On datapicker closed
   */
	@Output() onClose = new EventEmitter();

	private positions = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];

	innerValue: Date;
	displayValue: string;
	displayFormat: string;
	date: Date;
	barTitle: string;
	barTitleFormat: string;
	minYear: number;
	maxYear: number;
	firstCalendarDay: number;
	view: string;
	years: { year: number; isThisYear: boolean }[];
	months: { name: string; isSelected: boolean }[];
	dayNames: string[];
	scrollOptions: ISlimScrollOptions;
	days: {
		date: Date;
		day: number;
		month: number;
		year: number;
		inThisMonth: boolean;
		isToday: boolean;
		isSelected: boolean;
	}[];
	locale: object;
	minView: string;

	monthShortName: string[];
	monthLongName: string[];

	private onTouchedCallback: () => void = () => { };
	private onChangeCallback: (_: any) => void = () => { };

	get value(): Date {
		return this.innerValue;
	}

	set value(val: Date) {
		this.innerValue = val;
		this.onChangeCallback(this.innerValue);
	}

	constructor(private elementRef: ElementRef) {
		this.scrollOptions = {
			barBackground: '#DFE3E9',
			gridBackground: '#FFFFFF',
			barBorderRadius: '3',
			gridBorderRadius: '3',
			barWidth: '6',
			gridWidth: '6',
			barMargin: '0',
			gridMargin: '0'
		};

		this.monthShortName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		this.monthLongName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	}

	ngOnInit() {
		this.date = new Date();
		this.setOptions();
		this.view = this.minView || 'days';
		this.initDayNames();
		this.initYears();
		this.initMonth();

		// Check if 'position' property is correct
		if (this.positions.indexOf(this.position) === -1) {
			throw new TypeError(`ng-datepicker: invalid position property value '${this.position}' (expected: ${this.positions.join(', ')})`);
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		if ('options' in changes) {
			this.setOptions();
			this.initDayNames();
			this.init();
			this.initYears();
			this.initMonth();
		}
	}

	setOptions(): void {
		const today = new Date(); // this const was added because during my tests, I noticed that at this level this.date is undefined
		this.minYear = this.options && this.options.minYear || getYear(today) - 30;
		this.maxYear = this.options && this.options.maxYear || getYear(today) + 100;

		this.displayFormat = this.options && this.options.displayFormat || 'MMM D[,] YYYY';
		this.barTitleFormat = this.options && this.options.barTitleFormat || 'MMMM YYYY';
		this.firstCalendarDay = this.options && this.options.firstCalendarDay || 0;
		this.locale = this.options && { locale: this.options.locale } || {};
		this.minView = this.options && this.options.minView || 'days';
	}

	next(): void {

		if (this.view === 'days') {
			this.date = addMonths(this.date, 1);
			this.init();
		} else {
			this.date = addYears(this.date, 1);
			this.initMonth();
			this.barTitle = format(startOfYear(this.date), this.barTitleFormat, this.locale);
		}
	}

	prev(): void {

		if (this.view === 'days') {
			this.date = subMonths(this.date, 1);
			this.init();
		} else {
			this.date = subYears(this.date, 1);
			this.initMonth();
			this.barTitle = format(startOfYear(this.date), this.barTitleFormat, this.locale);
		}
	}

	setDate(i: number): void {
		this.date = this.days[i].date;
		this.value = this.date;
		this.init();
		this.close();
	}

	setMonth(i: number): void {
		this.date = setMonth(this.date, i);
		if (this.minView === 'months') {
			this.value = startOfMonth(this.date);
			this.close();
		} else {
			this.gotoDayView();
		}
	}

	setYear(i: number): void {
		this.date = setYear(this.date, this.years[i].year);
		if (this.minView === 'years') {
			this.value = startOfYear(this.date);
			this.close();
		} else {
			this.gotoMonthView();
		}
	}


	gotoDayView() {
		this.barTitleFormat = 'MMMM YYYY';
		this.view = 'days';
		this.init();
	}

	gotoMonthView() {
		this.initMonth();
		this.barTitleFormat = 'YYYY';
		this.view = 'months';
		this.barTitle = format(startOfMonth(this.date), this.barTitleFormat, this.locale);
	}

	gotoYearView() {
		this.initYears();
		this.barTitleFormat = 'YYYY';
		this.view = 'years';
		this.barTitle = format(startOfYear(this.date), this.barTitleFormat, this.locale);
	}

	init(): void {
		const start = startOfMonth(this.date);
		const end = endOfMonth(this.date);

		this.days = eachDay(start, end).map(date => {
			return {
				date: date,
				day: getDate(date),
				month: getMonth(date),
				year: getYear(date),
				inThisMonth: true,
				isToday: isToday(date),
				isSelected: isSameDay(date, this.innerValue) && isSameMonth(date, this.innerValue) && isSameYear(date, this.innerValue)
			};
		});

		for (let i = 1; i <= getDay(start) - this.firstCalendarDay; i++) {
			const date = subDays(start, i);
			this.days.unshift({
				date: date,
				day: getDate(date),
				month: getMonth(date),
				year: getYear(date),
				inThisMonth: false,
				isToday: isToday(date),
				isSelected: isSameDay(date, this.innerValue) && isSameMonth(date, this.innerValue) && isSameYear(date, this.innerValue)
			});
		}

		this.displayValue = format(this.innerValue, this.displayFormat, this.locale);
		this.barTitle = format(start, this.barTitleFormat, this.locale);

	}

	initYears(): void {
		const range = this.maxYear - this.minYear;
		this.years = Array.from(new Array(range), (x, i) => i + this.minYear).map(year => {
			return { year: year, isThisYear: year === getYear(this.date) };
		});
	}

	initDayNames(): void {
		this.dayNames = [];
		const start = this.firstCalendarDay;
		for (let i = start; i <= 6 + start; i++) {
			const date = setDay(new Date(), i);
			this.dayNames.push(format(date, 'ddd', this.locale));
		}
	}

	initMonth(): void {
		this.months = this.monthLongName.map((month, i) => ({ name: month, isSelected: isSameYear(this.date, this.innerValue) && i === getMonth(this.innerValue) }));
	}

	toggleView(): void {
		switch (this.view) {
			case 'days': this.gotoMonthView(); break;
			case 'months': this.gotoYearView(); break;
			case 'years': this.gotoMonthView(); break;
		}		
	}
	

	toggle(): void {
		this.isOpened = !this.isOpened;
	}

	close(): void {
		this.isOpened = false;
		this.onClose.emit();
		this.view = this.minView || 'days';
	}

	writeValue(val: Date) {
		if (val) {
			this.date = val;
			this.innerValue = val;
			this.init();
			this.displayValue = format(this.innerValue, this.displayFormat, this.locale);
			this.barTitle = format(startOfMonth(val), this.barTitleFormat, this.locale);
		}
	}

	registerOnChange(fn: any) {
		this.onChangeCallback = fn;
	}

	registerOnTouched(fn: any) {
		this.onTouchedCallback = fn;
	}

	@HostListener('document:click', ['$event']) onBlur(e: MouseEvent) {
		if (!this.isOpened) {
			return;
		}

		if (!this.headless) {

			const input = this.elementRef.nativeElement.querySelector('.ngx-datepicker-input');

			if (input == null) {
			  return;
			}

			if (e.target === input || input.contains(<any>e.target)) {
			  return;
			}
		}

		const container = this.elementRef.nativeElement.querySelector('.ngx-datepicker-container');
		if (container && container !== e.target
			&& !container.contains(<any>e.target)
			&& !(<any>e.target).classList.contains('year-unit')
			&& !(<any>e.target).classList.contains('month-unit')
			&& !(<any>e.target).classList.contains('topbar-title')) {
			this.close();
		}
	}
}
