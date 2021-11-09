import {Injectable} from '@angular/core'
import {ToastrService} from 'ngx-toastr'

import {DEFAULT_TOAST_CONFIG} from '@app/shared/constants/config.constants'

@Injectable()
export class AlertService {

  constructor(
    private toastr: ToastrService
  ) {
  }

  public warningDialog(
    title: string, message?: string, type: 'error' | 'warning' = 'error', timeout?: number
  ): void {
    if (!(type === 'error' || type === 'warning')) return

    const config = {...DEFAULT_TOAST_CONFIG}

    if (timeout) {
      config.timeOut = timeout
    }

    if (!message) {
      this.toastr[type](title, '', config)
      return
    }

    this.toastr[type](message, title, config)
  }

}
