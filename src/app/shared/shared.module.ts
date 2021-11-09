import {NgModule} from '@angular/core'
import {CommonModule} from '@angular/common'
import {ReactiveFormsModule} from '@angular/forms'
import {TranslateModule} from '@ngx-translate/core'
import {NgPrimeModule} from '@app/shared/ng-prime.module'
import {ToastrModule} from 'ngx-toastr'

import {
  MapComponent,
  ModalsComponent,
  NavigationControlsComponent,
  NavigationPanelComponent,
  RouteOptionsModalComponent,
  SelectLanguageModalComponent
} from '@app/shared/components'

const components = [
  MapComponent,
  NavigationControlsComponent,
  NavigationPanelComponent,
  RouteOptionsModalComponent,
  ModalsComponent,
  SelectLanguageModalComponent
]

const modules = [
  NgPrimeModule,
  ReactiveFormsModule,
  TranslateModule,
  ToastrModule.forRoot()
]

@NgModule({
  declarations: [
    components
  ],
  providers: [],
  imports: [
    CommonModule,
    modules
  ],
  exports: [
    modules,
    components
  ]
})
export class SharedModule {
}
