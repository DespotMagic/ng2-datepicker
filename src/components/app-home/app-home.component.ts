import { Component } from '@angular/core';
import { DatepickerOptions } from '../../ng-datepicker/ng-datepicker.component';
import * as enLocale from 'date-fns/locale/en';
import * as frLocale from 'date-fns/locale/fr';


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
	selector: 'app-home',
	templateUrl: 'app-home.component.html'
})
export class AppHomeComponent {
	date: Date;
	options: DatepickerOptions = {
	
	};

	private isDialogOpen = false;

	private dis: boolean = false;

	mode: string = null;

	inputDate;

	constructor() {
		this.date = new Date();
		this.setInputDate(this.date);
	}

	openDialog() {
		this.isDialogOpen = true;
	}

	dialogClosed () {
		this.isDialogOpen = false;
	}

	setInputDate(date) {
		this.inputDate = format(date, 'MM/YYYY')
	}

	onChane(newDate) {
		this.setInputDate(newDate);
	}
	
}
