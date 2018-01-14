import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Observable } from 'rxjs/Observable';

import { OSASGService } from "./osasg.service";

@Component({
  selector: "login-form",
  templateUrl: "/templates/login_form.html",
})
export class LoginFormComponent {
  username: string = "";
  password: string = "";
  submitting: Boolean = false;
  successMessage: string = null;
  errorMessage: string = null;

  constructor (private osasgService: OSASGService, private router: Router) {}

  onSubmit(): void {
    if (this.submitting) {
      return;
    }
    this.submitting = true;
    this.osasgService.login(this.username, this.password)
        .then(message => {
          this.successMessage = message;
          this.errorMessage = null;
          this.submitting = false;
          this.osasgService.onSignIn();
          this.router.navigateByUrl("");
        })
        .catch(error => this.handleError(error));
  }

  private handleError(error) {
    this.successMessage = null;
    this.errorMessage = error.message;
    this.submitting = false;
  }
}
