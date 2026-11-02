/**
 * Form Enhancement Behaviors
 * -----------------------------------------------------------------------------
 * Enhances standard HTML form elements with better UX and validation.
 * Includes inputs, password toggles, search, and form validation.
 *
 * Helper Attribute: [x-enhancements]
 * -----------------------------------------------------------------------------
 *
 * Every behavior that used to live here now has its own module, and the
 * registry (index.js) loads those modules directly -- nothing imports this
 * file (#779). It held a second, drifting copy of each behavior (#883); it is
 * now only a re-export of the standalone modules, so each behavior exists
 * exactly once and every name this module ever exported keeps working.
 *
 * masked, otp, colorpicker, tags and autocomplete are WB Pro (#1953).
 *
 * Usage:
 *   <form data-ajax>...</form>
 *   <input x-password>
 */
import { form } from './form.js';
import { fieldset } from './fieldset.js';
import { label } from './label.js';
import { help } from './help.js';
import { error } from './error.js';
import { inputgroup } from './inputgroup.js';
import { formrow } from './formrow.js';
import { stepper } from './stepper.js';
import { search } from './search.js';
import { password } from './password.js';
import { counter } from './counter.js';
import { floatinglabel } from './floatinglabel.js';
import { file } from './file.js';

export {
  form, fieldset, label, help, error, inputgroup, formrow,
  stepper, search, password, counter, floatinglabel, file
};

export default {
  form, fieldset, label, help, error, inputgroup, formrow,
  stepper, search, password, counter, floatinglabel, file
};
