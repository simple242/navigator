import {Injectable} from '@angular/core'
import {FormControl, ValidatorFn, Validators} from '@angular/forms'

import {ControlConfig, ControlItem} from '@app/shared/models'

@Injectable()
export class FormControlsService {

  constructor() {
  }

  public getStartControl(config?: ControlConfig): ControlItem {
    const correctConfig: ControlConfig = {
      value: config?.value || null,
      required: config?.required || false
    }

    const validators: ValidatorFn[] = []

    if (correctConfig.required) validators.push(Validators.required)

    return {
      control: new FormControl(correctConfig.value, validators),
      validators
    }
  }

  public getEndControl(config?: ControlConfig): ControlItem {
    const correctConfig: ControlConfig = {
      value: config?.value || null,
      required: config?.required || false
    }

    const validators: ValidatorFn[] = []

    if (correctConfig.required) validators.push(Validators.required)

    return {
      control: new FormControl(correctConfig.value, validators),
      validators
    }
  }

  public getTransportControl(config?: ControlConfig): ControlItem {
    const correctConfig: ControlConfig = {
      value: config?.value || null,
      required: config?.required || false
    }

    const validators: ValidatorFn[] = []

    if (correctConfig.required) validators.push(Validators.required)

    return {
      control: new FormControl(correctConfig.value, validators),
      validators
    }
  }

}
