import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { environment } from '../environments/environment';

import { AppMaterialModule } from './app-material.module';
import { ServiceWorkerModule } from '@angular/service-worker';
import { WebWorkerService } from './services/web-worker';

import { NgxsModule } from 'ngxs';
import { HoursStore } from '@store/.';

import { AppRoutingModule } from './app-routing.module';
import { DurationPipe } from './duration.pipe';

import { AppComponent } from './app.component';
import { ActiveTaskComponent } from './active-task/active-task.component';
import { AddGroupComponent } from './add-group/add-group.component';
import { AddTaskComponent } from './add-task/add-task.component';
import { ColorTagComponent } from './color-tag/color-tag.component';
import { GroupsComponent } from './groups/groups.component';
import { TasksComponent } from './tasks/tasks.component';
import { UsageComponent } from './usage/usage.component';
import { ConfirmDeleteComponent } from './confirm-delete/confirm-delete.component';

@NgModule({
  declarations: [
    AppComponent,
    ActiveTaskComponent,
    AddGroupComponent,
    AddTaskComponent,
    ColorTagComponent,
    ConfirmDeleteComponent,
    DurationPipe,
    GroupsComponent,
    TasksComponent,
    UsageComponent,
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    ReactiveFormsModule,
    ServiceWorkerModule.register('ngsw-worker.js', { enabled: environment.production }),
    NgxsModule.forRoot([HoursStore]),
    AppRoutingModule,
    AppMaterialModule,
  ],
  providers: [
    HoursStore,
    WebWorkerService
  ],
  entryComponents: [
    AddGroupComponent,
    AddTaskComponent,
    ConfirmDeleteComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
