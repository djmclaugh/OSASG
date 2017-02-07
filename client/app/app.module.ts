import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';
import { HttpModule } from '@angular/http';

import { AppComponent } from './app.component';
import { LoginFormComponent } from "./login-form.component";

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    HttpModule
   ],
  bootstrap: [AppComponent],
  declarations: [
    AppComponent,
    LoginFormComponent
   ],
})
export class AppModule {}
