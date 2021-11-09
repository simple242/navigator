import {Component, OnInit} from '@angular/core'

import {LocalizeService, ModalsService} from '@app/shared/services'
import {Lang} from '@app/shared/models/lang.model'

@Component({
  selector: 'app-select-modal-language',
  templateUrl: './select-language-modal.component.html',
  styleUrls: ['./select-language-modal.component.scss']
})
export class SelectLanguageModalComponent implements OnInit {

  public currentLang: Lang | null = null

  constructor(
    public localizeSvc: LocalizeService,
    public modalsSvc: ModalsService
  ) {
  }

  ngOnInit() {
    this.currentLang = this.localizeSvc.currentLang
  }

  public setCurrentLanguage(lang: Lang): void {
    if (!lang) return
    this.localizeSvc.changeLanguage(lang)
    this.currentLang = lang
    this.modalsSvc.isShowSelectLangModal = false
  }

}
