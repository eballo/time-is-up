import { test, describe } from "node:test";
import assert from "node:assert/strict";

import { languages } from "../src/i18n/index.js";
import { workoutsByLanguage, workoutsFor } from "../src/i18n/workouts/index.js";
import { Session, workoutDayBlocks } from "../src/js/core/session.js";

const reference = workoutsByLanguage.en;

/** Days → blocks → exercise count: what every language has to agree on. */
function shapeOf(days) {
  return days.map((day) => day.blocks.map((block) => block.exercises.length));
}

describe("the training programme", () => {
  test("every interface language has a translation of it", () => {
    for (const { code } of languages) {
      assert.ok(workoutsByLanguage[code], `no programme for ${code}`);
    }
  });

  test("every language has the same days, blocks and exercises", () => {
    for (const [code, days] of Object.entries(workoutsByLanguage)) {
      assert.deepEqual(shapeOf(days), shapeOf(reference), `${code} is out of step with en`);
    }
  });

  test("nothing is left blank", () => {
    for (const [code, days] of Object.entries(workoutsByLanguage)) {
      days.forEach((day, d) => {
        assert.ok(day.title.trim(), `${code} day ${d + 1} has no title`);
        for (const block of day.blocks) {
          assert.ok(block.title.trim(), `${code} day ${d + 1} has an untitled block`);
          for (const exercise of block.exercises) {
            assert.equal(exercise.length, 2, `${code} day ${d + 1}: ${exercise}`);
            assert.ok(exercise.every((text) => text.trim()), `${code} day ${d + 1}: ${exercise}`);
          }
        }
      });
    }
  });

  test("a language without a programme falls back to English", () => {
    assert.equal(workoutsFor("xx"), reference);
  });
});

describe("running a programme day", () => {
  const day = {
    title: "Day",
    blocks: [
      { title: "One", exercises: [["A", "do a"], ["B", "do b"]] },
      { title: "Two", exercises: [["C", "do c"]] }
    ]
  };

  test("each block goes round its exercises before the next block starts", () => {
    const blocks = workoutDayBlocks(day, 3);
    assert.deepEqual(
      blocks.map((block) => block.items.map((item) => item.label)),
      [["A", "B", "A", "B", "A", "B"], ["C", "C", "C"]]
    );
  });

  test("the session carries the descriptions and block titles through", () => {
    const session = Session.forTraining(workoutDayBlocks(day, 1), 30, 30);
    const seen = [];
    do {
      seen.push([session.currentLabel, session.currentDescription, session.currentBlockTitle]);
    } while (session.advance());
    assert.deepEqual(seen, [
      ["A", "do a", "One"],
      [null, "do b", "One"], // a rest shows what is coming
      ["B", "do b", "One"],
      [null, "do c", "Two"], // and the block it leads into
      ["C", "do c", "Two"]
    ]);
  });

  test("a typed list has no descriptions or block titles", () => {
    const session = Session.forTraining(["A"], 30, 0);
    assert.equal(session.currentDescription, null);
    assert.equal(session.currentBlockTitle, null);
  });
});

describe("exercise figures", async () => {
  const { FIGURES, PROGRAMME_FIGURES } = await import("../src/js/ui/exercise-figures.js");
  const JOINTS = ["head", "neck", "hip", "k1", "a1", "t1", "k2", "a2", "t2", "e1", "h1", "e2", "h2"];

  test("every figure the programme names exists", () => {
    for (const day of PROGRAMME_FIGURES) {
      for (const id of day.flat()) assert.ok(FIGURES[id], `no figure called ${id}`);
    }
  });

  test("the figure table lines up with the programme's days, blocks and exercises", () => {
    PROGRAMME_FIGURES.forEach((day, d) => {
      assert.deepEqual(
        day.map((block) => block.length),
        reference[d].blocks.map((block) => block.exercises.length),
        `day ${d + 1}`
      );
    });
  });

  test("every figure has a start and an end pose with every joint on the grid", () => {
    for (const [id, figure] of Object.entries(FIGURES)) {
      assert.equal(figure.poses.length, 2, id);
      for (const pose of figure.poses) {
        for (const joint of JOINTS) {
          const point = pose[joint];
          assert.ok(point, `${id} is missing ${joint}`);
          assert.ok(point.every((v) => v >= 0 && v <= 120), `${id} ${joint} is off the grid`);
        }
      }
    }
  });

  test("a curved back is curved in both poses, or the animation cannot morph", () => {
    for (const [id, figure] of Object.entries(FIGURES)) {
      const [start, end] = figure.poses;
      assert.equal(Boolean(start.spine), Boolean(end.spine), id);
    }
  });

  test("every day of the programme has its figures", () => {
    assert.equal(PROGRAMME_FIGURES.length, reference.length);
  });

  test("a programme day carries its figures through to the session", () => {
    const blocks = workoutDayBlocks(reference[0], 1, PROGRAMME_FIGURES[0]);
    const session = Session.forTraining(blocks, 20, 30);
    assert.equal(session.currentFigure, "chair-squat");
    session.advance(); // a rest shows the exercise coming up
    assert.equal(session.currentFigure, "calf-raise");
  });
});
