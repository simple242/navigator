import {FormControl, ValidatorFn} from '@angular/forms'

export interface ControlConfig {
  value?: ControlValue
  required?: boolean
}

export type ControlValue = string | number | null

export interface ControlItem {
  control: FormControl,
  validators: ValidatorFn[]
}
