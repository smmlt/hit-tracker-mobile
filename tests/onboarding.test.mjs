import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { translations } from '../src/localization/translations.js';
import { ONBOARDING_COMPLETED_KEY, ONBOARDING_COMPLETED_VALUE, isOnboardingCompleted } from '../src/utils/onboarding.js';

const read = (file) => fs.readFileSync(new URL(`../${file}`, import.meta.url), 'utf8');

test('onboarding contract is persisted, localized, adaptive, and wired', () => {
  assert.equal(ONBOARDING_COMPLETED_KEY, 'onboarding_completed');
  assert.equal(ONBOARDING_COMPLETED_VALUE, 'true');
  assert.equal(isOnboardingCompleted('true'), true);
  assert.equal(isOnboardingCompleted('false'), false);
  for (const key of ['onboardingGoalTitle', 'onboardingGoalDescription', 'onboardingProgressTitle', 'onboardingProgressDescription', 'onboardingCommunityTitle', 'onboardingCommunityDescription', 'onboardingSignIn', 'onboardingSignUp', 'skip', 'continue']) {
    assert.equal(typeof translations.en[key], 'string');
    assert.equal(typeof translations.uk[key], 'string');
  }
  const screen = read('src/screens/OnboardingScreen.js');
  const app = read('App.js');
  const navigator = read('src/navigation/AppNavigator.js');
  const styles = read('src/screens/OnboardingScreen.styles.js');
  assert.match(screen, /\/onboarding\/(goal|progress|community)/);
  assert.match(screen, /duration:.*700/);
  assert.match(screen, /duration:.*800/);
  assert.match(screen, /AsyncStorage\.setItem/);
  assert.match(app, /ONBOARDING_COMPLETED_KEY/);
  assert.match(app, /!userToken && !onboardingComplete/);
  assert.match(app, /if \(!userToken \|\| onboardingComplete !== false\) return/);
  assert.match(app, /onOnboardingComplete/);
  assert.match(navigator, /name="Onboarding"/);
  assert.match(styles, /useWindowDimensions|width/);
  assert.doesNotMatch(styles, /393|854|height:\s*\d{3}/);
});
