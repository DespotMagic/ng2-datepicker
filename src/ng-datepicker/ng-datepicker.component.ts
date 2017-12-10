import { Component, OnInit, Input, Output, OnChanges, SimpleChanges, ElementRef, HostListener, forwardRef, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import { ISlimScrollOptions } from 'ngx-slimscroll';

import * as moment from 'moment';
const Moment: any = (<any>moment).default || moment;

export interface DatepickerOptions {
	minYear?: number;
	maxYear?: number;
	firstWeekdaySunday?: boolean; // 0 = Sunday (default), 1 = Monday, ..
	locale?: object;

	minView?: 'days' | 'months' | 'years';
	//startView?: 'days' | 'months' | 'years';
}


export interface CalendarDate {
	day: number;
	month: number;
	year: number;
	enabled: boolean;
	isToday: boolean;
	isSelected: boolean;
	momentObj: moment.Moment;
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
	date: moment.Moment;
	barTitle: string;
	barTitleFormat: string = 'MMMM YYYY';
	minYear: number;
	maxYear: number;
	firstWeekdaySunday: boolean;
	view: string;
	years: { year: number; isThisYear: boolean }[];
	months: { name: string; isSelected: boolean }[];
	dayNames: string[];
	scrollOptions: ISlimScrollOptions;
	days: CalendarDate[];
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
		this.options = this.options || {};
		this.monthShortName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
		this.monthLongName = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
	}

	ngOnInit() {
		this.date = Moment();

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

		this.setOptions();
		this.view = this.minView || 'days';

		this.initDayNames();

		this.generateCalendar();
		this.generateMonths();
		this.generateYears();

		if (this.positions.indexOf(this.position) === -1) {
			throw new TypeError(`ng-datepicker: invalid position property value '${this.position}' (expected: ${this.positions.join(', ')})`);
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		if ('options' in changes) {
			this.close();
			this.setOptions();
		}
	}

	setOptions(): void {
		const today: moment.Moment = Moment();

		this.minYear = this.options.minYear || today.year() - 100;
		this.maxYear = this.options.maxYear || today.year() + 100;
		this.firstWeekdaySunday = this.options.firstWeekdaySunday || true;
		this.locale = this.options.locale && { locale: this.options.locale } || {};
		this.minView = this.options.minView || 'days';

		//this.startView = this.options && this.options.startView || this.minView;
	}

	next(): void {

		if (this.view === 'days') {
			this.date.add(1,'month');
			this.generateCalendar();
		} else {
			this.date.add(1, 'year');
			this.generateMonths();
		}
	}

	prev(): void {

		if (this.view === 'days') {
			this.date.subtract(1, 'month');
			this.generateCalendar();
		} else {
			this.date.subtract(1, 'year');
			this.generateMonths();
		}
	}

	setDate(e: MouseEvent, seletedDate: moment.Moment): void {
		e.preventDefault();

		this.date = seletedDate;
		this.value = this.date.toDate();
		this.generateCalendar();
		this.close();
	}

	setMonth(e: MouseEvent, month: number): void {
		e.preventDefault();

		this.date = this.date.month(month);

		if (this.minView === 'months') {
			this.value = this.date.startOf('month').toDate();
			this.close();
		} else {
			this.gotoDayView();
		}
	}

	setYear(e: MouseEvent, year: number): void {
		e.preventDefault();

		this.date = this.date.year(year);

		if (this.minView === 'years') {
			this.value = this.date.startOf('year').toDate();
			this.close();
		} else {
			this.gotoMonthView();
		}
	}


	gotoDayView() {
		this.view = 'days';
		this.generateCalendar();
	}

	gotoMonthView() {
		this.generateMonths();
		this.view = 'months';
	}

	gotoYearView() {
		this.generateYears();
		this.view = 'years';
	}

	//generateCalendar__OLD(): void {


	//	const date: moment.Moment = Moment(this.date);
	//	const month = date.month();
	//	const year = date.year();


	//	const start = startOfMonth(this.date);
	//	const end = endOfMonth(this.date);

	//	this.days = eachDay(start, end).map(date => {
	//		return {
	//			date: date,
	//			day: getDate(date),
	//			month: getMonth(date),
	//			year: getYear(date),
	//			inThisMonth: true,
	//			isToday: isToday(date),
	//			isSelected: isSameDay(date, this.innerValue) && isSameMonth(date, this.innerValue) && isSameYear(date, this.innerValue)
	//		};
	//	});

	//	for (let i = 1; i <= getDay(start) - this.firstWeekDay; i++) {
	//		const date = subDays(start, i);
	//		this.days.unshift({
	//			date: date,
	//			day: getDate(date),
	//			month: getMonth(date),
	//			year: getYear(date),
	//			inThisMonth: false,
	//			isToday: isToday(date),
	//			isSelected: isSameDay(date, this.innerValue) && isSameMonth(date, this.innerValue) && isSameYear(date, this.innerValue)
	//		});
	//	}

	//	//this.displayValue = format(this.innerValue, this.displayFormat, this.locale);
	//	//this.barTitle = format(start, this.barTitleFormat, this.locale);

	//	initDayNames();
	//}


	generateCalendar() {
		const month = this.date.month();
		const year = this.date.year();
		let n = 1;

		const firstWeekDay = (this.firstWeekdaySunday) ? this.date.date(2).day() : this.date.date(1).day();

		if (firstWeekDay !== 1) {
			n -= (firstWeekDay + 6) % 7;
		}

		this.days = [];
		const selectedDate: moment.Moment = Moment(this.innerValue);

		for (let i = n; i <= this.date.endOf('month').date(); i += 1) {
			const currentDate: moment.Moment = Moment(`${i}.${month + 1}.${year}`, 'DD.MM.YYYY');
			const today: boolean = (Moment().isSame(currentDate, 'day') && Moment().isSame(currentDate, 'month'));
			const selected: boolean = (selectedDate && selectedDate.isSame(currentDate, 'day'));
			let betweenMinMax = true;

			//if (this.minDate !== null) {
			//	if (this.maxDate !== null) {
			//		betweenMinMax = currentDate.isBetween(this.minDate, this.maxDate, 'day', '[]') ? true : false;
			//	} else {
			//		betweenMinMax = currentDate.isBefore(this.minDate, 'day') ? false : true;
			//	}
			//} else {
			//	if (this.maxDate !== null) {
			//		betweenMinMax = currentDate.isAfter(this.maxDate, 'day') ? false : true;
			//	}
			//}

			const day: CalendarDate = {
				day: i > 0 ? i : null,
				month: i > 0 ? month : null,
				year: i > 0 ? year : null,
				enabled: i > 0 ? betweenMinMax : false,
				isToday: i > 0 && today ? true : false,
				isSelected: i > 0 && selected ? true : false,
				momentObj: currentDate
			};

			this.days.push(day);
		}
	}


	initDayNames(): void {
		this.dayNames = [];
		const start = this.firstWeekdaySunday ? 0 : 1;
		for (let i = start; i <= 6 + start; i++) {
			this.dayNames.push(Moment().day(i).format('ddd'));
		}
	}

	generateMonths(): void {
		const selectedDate: moment.Moment = Moment(this.innerValue);

		this.months = this.monthLongName.map((month, i) => ({
			name: month,
			isSelected: (selectedDate && selectedDate.isSame(this.date, 'year') && i === selectedDate.month()) ? true : false
		}));
	}

	generateYears(): void {
		const range = this.maxYear - this.minYear;
		this.years = Array.from(new Array(range), (x, i) => i + this.minYear).map(year => {
			return { year: year, isThisYear: year === this.date.year() };
		});
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
		if (this.isOpened) {
			this.isOpened = false;
			this.onClose.emit();
			this.view = this.minView || 'days';
		}
	}

	writeValue(val: Date) {
		if (val) {
			this.date = Moment(val);
			this.innerValue = val;
		}
	}

	registerOnChange(fn: any) {
		this.onChangeCallback = fn;
	}

	registerOnTouched(fn: any) {
		this.onTouchedCallback = fn;
	}

	@HostListener('document:click', ['$event']) onCLick(e: MouseEvent) {
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

		//const container = this.elementRef.nativeElement.querySelector('.ngx-datepicker-container');

		if (this.elementRef.nativeElement !== e.target && !this.elementRef.nativeElement.contains((<any>e.target))) {
			this.close();
		}

		//if (container && container !== e.target
		//	&& !container.contains(<any>e.target)
		//	&& !(<any>e.target).classList.contains('year-unit')
		//	&& !(<any>e.target).classList.contains('month-unit')
		//	&& !(<any>e.target).classList.contains('topbar-title')) {
		//	this.close();
		//}
	}
}
