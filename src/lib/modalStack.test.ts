import assert from "node:assert/strict";
import {
  pushModal,
  popAndDismiss,
  getModalStackDepth,
  _resetModalStackForTesting,
} from "./modalStack";

// Ensure clean state
_resetModalStackForTesting();
assert.equal(getModalStackDepth(), 0, "Initial modal stack depth must be 0");

// 1. Single modal push and pop
let modal1Dismissed = false;
const unregister1 = pushModal(() => {
  modal1Dismissed = true;
});
assert.equal(getModalStackDepth(), 1);

const popped = popAndDismiss();
assert.equal(popped, true);
assert.equal(modal1Dismissed, true, "Topmost modal handler must be invoked on pop");
assert.equal(getModalStackDepth(), 0);

// Cleanup call after pop should be idempotent
unregister1();
assert.equal(getModalStackDepth(), 0);

// 2. LIFO ordering with stacked modals
let modalADismissed = false;
let modalBDismissed = false;
let modalCDismissed = false;

const unregA = pushModal(() => { modalADismissed = true; });
const unregB = pushModal(() => { modalBDismissed = true; });
const unregC = pushModal(() => { modalCDismissed = true; });
assert.equal(getModalStackDepth(), 3);

// First pop should dismiss C only
popAndDismiss();
assert.equal(modalCDismissed, true);
assert.equal(modalBDismissed, false);
assert.equal(modalADismissed, false);
assert.equal(getModalStackDepth(), 2);

// Second pop should dismiss B only
popAndDismiss();
assert.equal(modalBDismissed, true);
assert.equal(modalADismissed, false);
assert.equal(getModalStackDepth(), 1);

// Third pop should dismiss A
popAndDismiss();
assert.equal(modalADismissed, true);
assert.equal(getModalStackDepth(), 0);

// Fourth pop on empty stack returns false
assert.equal(popAndDismiss(), false);

// 3. Out-of-order unregistration
const calls: number[] = [];
const unreg0 = pushModal(() => calls.push(0));
const unreg1 = pushModal(() => calls.push(1));
const unreg2 = pushModal(() => calls.push(2));
assert.equal(getModalStackDepth(), 3);

// Middle modal 1 dismissed by user action (unregistered)
unreg1();
assert.equal(getModalStackDepth(), 2);

// Next pop should dismiss 2
popAndDismiss();
assert.deepEqual(calls, [2]);
assert.equal(getModalStackDepth(), 1);

// Next pop should dismiss 0
popAndDismiss();
assert.deepEqual(calls, [2, 0]);
assert.equal(getModalStackDepth(), 0);

// 4. Stress test: 10,000 rapid cycles
for (let i = 0; i < 10000; i++) {
  const unreg = pushModal(() => {});
  unreg();
}
assert.equal(getModalStackDepth(), 0, "Stack must remain 0 after 10,000 cycles");

console.log("modalStack unit tests passed successfully!");
