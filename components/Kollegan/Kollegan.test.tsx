import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import Kollegan from "./Kollegan";
import styles from "./Kollegan.module.css";
import type { KollegSize, KollegState } from "./types";

afterEach(cleanup);

const STATES: KollegState[] = ["idle", "listening", "asking", "done"];
const SIZES: KollegSize[] = ["large", "small", "tiny"];

describe("Kollegan states", () => {
  it.each(STATES)("renders the %s state without throwing", (state) => {
    render(<Kollegan state={state} />);
    expect(
      screen.getByRole("img", { name: `Kollegan, status: ${state}` }),
    ).toBeTruthy();
  });

  it("only shows the speech bubble in the asking state", () => {
    render(<Kollegan state="idle" message="Något väntar." />);
    expect(screen.queryByRole("alertdialog")).toBeNull();

    cleanup();

    render(<Kollegan state="asking" message="Något väntar." />);
    expect(screen.getByRole("alertdialog")).toBeTruthy();
  });
});

describe("Kollegan size variants", () => {
  it.each(SIZES)(
    "resolves the %s size to its own figure class, not another size's",
    (size) => {
      const { container } = render(<Kollegan state="idle" size={size} />);
      const wrapper = container.firstElementChild as HTMLElement;

      expect(wrapper.classList.contains(styles[size])).toBe(true);

      for (const otherSize of SIZES) {
        if (otherSize !== size) {
          expect(wrapper.classList.contains(styles[otherSize])).toBe(false);
        }
      }
    },
  );

  it.each(STATES)(
    "resolves to the correct status for every size at %s",
    (state) => {
      for (const size of SIZES) {
        const { unmount } = render(<Kollegan state={state} size={size} />);
        expect(
          screen.getByRole("img", { name: `Kollegan, status: ${state}` }),
        ).toBeTruthy();
        unmount();
      }
    },
  );
});

describe("Kollegan speech bubble", () => {
  it("renders the message text passed via props", () => {
    const message =
      "Fakturautkast till Björkvägen 12 (2 450 kr) väntar på godkännande.";
    render(<Kollegan state="asking" message={message} />);

    expect(screen.getByText(message)).toBeTruthy();
  });

  it("falls back to a default message when none is provided", () => {
    render(<Kollegan state="asking" />);

    expect(
      screen.getByText("Något väntar på ditt godkännande."),
    ).toBeTruthy();
  });
});
