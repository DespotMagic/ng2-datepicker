import { Component, OnInit, Input, Output, OnChanges, SimpleChanges, ElementRef, HostListener, forwardRef, EventEmitter } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor  } from '@angular/forms';
import { ISlimScrollOptions } from 'ngx-slimscroll';

import * as moment from 'moment';
const Moment: any = (<any>moment).default || moment;

export interface DatepickerOptions {
	minDate?: Date;
	maxDate?: Date;
	firstWeekdaySunday?: boolean;
	minView?: 'days' | 'months' | 'years';
}

interface CalendarDate {
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
	 * Set datepicker's visibility state
	 */
	@Input() isOpened = false;

	/**
	*  On datapicker closed
	*/
	@Output() onClose = new EventEmitter();

	/**
	 * Datepicker dropdown position
	 */
	@Input() position = 'bottom-right';

	private innerValue: moment.Moment;
	private date: moment.Moment;
	private skipOneClick: boolean;

	minDate?: Date;
	maxDate?: Date;

	firstWeekdaySunday: boolean;
	view: string;
	minView: string;

	private years: { year: number; isThisYear: boolean }[];
	private months: { name: string; isSelected: boolean; enabled: boolean }[];
	private days: CalendarDate[];
	private dayNames: string[];

	private scrollOptions: ISlimScrollOptions;

	private positions: string[] = ['bottom-left', 'bottom-right', 'top-left', 'top-right'];
	private monthShortName: string[] = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
	private monthLongName: string[] = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

	private onTouchedCallback: () => void = () => { };
	private onChangeCallback: (_: any) => void = () => { };

	get value(): moment.Moment {
		return this.innerValue;
	}

	set value(val: moment.Moment) {
		this.innerValue = val;
		this.onChangeCallback(this.innerValue);
	}

	constructor(private elementRef: ElementRef) {
		this.options = this.options || {};
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

		this.initDayNames();

		this.generateYears();

		if (this.positions.indexOf(this.position) === -1) {
			throw new TypeError(`ng-datepicker: invalid position property value '${this.position}' (expected: ${this.positions.join(', ')})`);
		}
	}

	ngOnChanges(changes: SimpleChanges) {
		if ('options' in changes && !changes['options'].firstChange) {
			this.close();
			this.setOptions();
		}

		if ('isOpened' in changes) {
			if (changes['isOpened'].currentValue === true) {
				this.skipOneClick = true;
			}

			if (this.isOpened) this.initView();

		}
	}

	setOptions(): void {

		this.minDate = this.options.minDate ? this.options.minDate : null;
		this.maxDate = this.options.maxDate ? this.options.maxDate : null;
		this.firstWeekdaySunday = this.options.firstWeekdaySunday || true;
		this.minView = this.options.minView || 'months';
		this.view = this.minView;

	}

	next(): void {
		this.nextMonthOrYear(this.view === 'days' ? 'month' : 'year');
	}

	prev(): void {
		this.prevMonthOrYear(this.view === 'days' ? 'month' : 'year');
	}

	nextMonthOrYear(part: 'month' | 'year') {

		if (this.maxDate) {
			const nextData: moment.Moment = Moment(this.date).add(1, part);

			if (nextData.isAfter(this.maxDate, part)) {
				return;
			}
		}

		this.date.add(1, part);
		this.initView();
	}

	prevMonthOrYear(part: 'month' | 'year') {

		if (this.minDate) {
			const prevData: moment.Moment = Moment(this.date).subtract(1, part);

			if (prevData.isBefore(this.minDate, part)) {
				return;
			}
		}

		this.date.subtract(1, part);
		this.initView();
	}

	setDate(e: MouseEvent, seletedDate: moment.Moment): void {
		e.preventDefault();

		this.date = seletedDate;
		this.value = this.date;
		this.close();
	}

	setMonth(e: MouseEvent, month: number): void {
		e.preventDefault();

		this.date = this.date.month(month);

		if (this.minView === 'months') {
			this.value = this.date.startOf('month');
			this.close();
		} else {
			this.gotoDayView();
		}
	}

	setYear(e: MouseEvent, year: number): void {
		e.preventDefault();

		this.date = this.date.year(year);

		if (this.minView === 'years') {
			this.value = this.date.startOf('year');
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

	initView(v?: string) {
		const view = v || this.view;
		switch (view) {
			case 'months': this.generateMonths(); break;
			case 'years': this.generateYears(); break;
			default: this.generateCalendar();
		}
	}

	generateCalendar() {
		const date: moment.Moment = Moment(this.date);
		const month = this.date.month();
		const year = this.date.year();
		let n = 1;

		const firstWeekDay = (this.firstWeekdaySunday) ? date.date(2).day() : date.date(1).day();

		if (firstWeekDay !== 1) {
			n -= (firstWeekDay + 6) % 7;
		}

		this.days = [];
		const selectedDate = Moment(this.innerValue);

		for (let i = n; i <= this.date.endOf('month').date(); i += 1) {
			const currentDate: moment.Moment = Moment(`${i}.${month + 1}.${year}`, 'DD.MM.YYYY');
			const today: boolean = (Moment().isSame(currentDate, 'day') && Moment().isSame(currentDate, 'month'));
			const selected: boolean = (selectedDate && selectedDate.isSame(currentDate, 'day'));
			let betweenMinMax = true;

			if (this.minDate !== null) {
				if (this.maxDate !== null) {
					betweenMinMax = currentDate.isBetween(this.minDate, this.maxDate, 'day', '[]') ? true : false;
				} else {
					betweenMinMax = currentDate.isBefore(this.minDate, 'day') ? false : true;
				}
			} else {
				if (this.maxDate !== null) {
					betweenMinMax = currentDate.isAfter(this.maxDate, 'day') ? false : true;
				}
			}

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


		let minMonth = 0;
		let maxMonth = 12;

		if (this.minDate !== null && this.date.isSame(this.minDate, 'year')) {
			minMonth = this.minDate.getMonth();
		}
		if (this.maxDate !== null && this.date.isSame(this.maxDate, 'year')) {
			maxMonth = this.maxDate.getMonth();
		}

		this.months = this.monthLongName.map((month, i) => {
			return {
				name: month,
				enabled: (i >= minMonth && i <= maxMonth),
				isSelected: (selectedDate && selectedDate.isSame(this.date, 'year') && i === selectedDate.month()) ? true : false
			};
		});
	}

	generateYears(): void {

		const minYear: number = this.minDate != null ? this.minDate.getFullYear() : Moment().year() - 110;
		const maxYear: number = this.maxDate != null ? this.maxDate.getFullYear() : Moment().year() + 110;

		const range = maxYear - minYear+1;
		this.years = Array.from(new Array(range), (x, i) => i + minYear).map(year => {
			return { year: year, isThisYear: year === this.date.year() };
		});
	}

	toggleView(): void {
		switch (this.view) {
			case 'days': this.gotoMonthView(); break;
			case 'months': this.gotoYearView(); break;
			case 'years': {
				if (this.minView !== 'years') {
					this.gotoMonthView();
				}
				break;
			}
		}		
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
			this.innerValue = Moment(val);
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

		if (this.skipOneClick) {
			this.skipOneClick = false;
			return;
		}

		const container = this.elementRef.nativeElement;

		if (container && container !== e.target
			&& !container.contains(<any>e.target)
			&& !(<any>e.target).classList.contains('year-unit')
			&& !(<any>e.target).classList.contains('month-unit')
			&& !(<any>e.target).classList.contains('topbar-title')
		) 
		{
			this.close();
		}
	}
}
