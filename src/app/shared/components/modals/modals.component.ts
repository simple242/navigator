import {Component, OnInit} from '@angular/core'

import {ModalsService} from '@app/shared/services'

@Component({
  selector: 'app-modals',
  templateUrl: './modals.component.html',
  styleUrls: ['./modals.component.scss']
})
export class ModalsComponent implements OnInit {

  constructor(
    public modalsSvc: ModalsService
  ) {
  }

  ngOnInit() {
  }

}
