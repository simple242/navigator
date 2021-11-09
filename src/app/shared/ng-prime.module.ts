import {NgModule} from '@angular/core'
import {CommonModule} from '@angular/common'

import {ButtonModule} from 'primeng/button'
import {RippleModule} from 'primeng/ripple'
import {DialogModule} from 'primeng/dialog'
import {InputTextModule} from 'primeng/inputtext'
import {AutoCompleteModule} from 'primeng/autocomplete'

const modules = [
  ButtonModule,
  RippleModule,
  DialogModule,
  InputTextModule,
  AutoCompleteModule
]

@NgModule({
  declarations: [],
  providers: [],
  imports: [
    CommonModule,
    modules
  ],
  exports: [
    modules
  ]
})
export class NgPrimeModule {
}
