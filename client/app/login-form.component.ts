import { Component } from '@angular/core';
import { Observable }     from 'rxjs/Observable';

import { OSASGService } from "./osasg.service";

@Component({
  selector: "login-form",
  templateUrl: "/templates/login_form.html",
})
export class LoginFormComponent {
  email: string = "";
  submitting: Boolean = false;
  successMessage: string = null;
  errorMessage: string = null;

  constructor (private osasgService: OSASGService) {}

  onSubmit(): void {
    if (this.submitting) {
      return;
    }
    this.submitting = true;
    this.osasgService.requestEmail(this.email)
        .then(message => {
          this.successMessage = message;
          this.errorMessage = null;
          this.submitting = false;
        })
        .catch(error => this.handleError(error));
  }

  currentUser(): string {
    return this.osasgService.isGuest() ? null : this.osasgService.getUsername();
  }

  private handleError(error) {
    this.successMessage = null;
    this.errorMessage = error.message;
    this.submitting = false;
  }
}