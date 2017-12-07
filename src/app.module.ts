import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';

import { AppComponent } from './app.component';
import { AppHomeComponent } from './components/app-home';
import { NgDatepickerModule } from './ng-datepicker';
import { DateInputModule } from './date-input';

@NgModule({
  declarations: [
    AppComponent,
    AppHomeComponent
  ],
  imports: [
    BrowserModule,
    CommonModule,
	  NgDatepickerModule,
	  DateInputModule
  ],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
