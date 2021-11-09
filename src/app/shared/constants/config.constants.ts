import {IndividualConfig} from 'ngx-toastr'

export const DEFAULT_TOAST_CONFIG:  Readonly<Partial<IndividualConfig>> = {
  timeOut: 3000,
  progressBar: true,
  progressAnimation: 'increasing'
}
