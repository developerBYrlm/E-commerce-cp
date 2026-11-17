import test from "node:test";
import assert from "node:assert/strict";
import { allowedOrderTransitions, canTransitionOrder } from "../server/utils/orderTransitions.js";

test("customers can cancel only before preparation starts", () => {
  assert.equal(canTransitionOrder("placed", "cancelled", "customer"), true);
  assert.equal(canTransitionOrder("accepted", "cancelled", "customer"), true);
  assert.equal(canTransitionOrder("preparing", "cancelled", "customer"), false);
  assert.equal(canTransitionOrder("placed", "accepted", "customer"), false);
});

test("owners advance orders only through the defined lifecycle", () => {
  assert.equal(canTransitionOrder("placed", "accepted", "owner"), true);
  assert.equal(canTransitionOrder("accepted", "ready", "owner"), false);
  assert.equal(canTransitionOrder("preparing", "ready", "owner"), true);
  assert.deepEqual(allowedOrderTransitions("ready", "owner", "pickup"), ["completed", "cancelled"]);
});

test("terminal and unknown states cannot be advanced", () => {
  assert.equal(canTransitionOrder("completed", "cancelled", "admin"), false);
  assert.deepEqual(allowedOrderTransitions("unknown", "admin", "delivery"), []);
});
