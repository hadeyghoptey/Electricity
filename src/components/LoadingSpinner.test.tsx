import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LoadingSpinner } from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders a spinning indicator", () => {
    const { container } = render(<LoadingSpinner />);
    const spinner = container.querySelector(".animate-spin");
    expect(spinner).toBeInTheDocument();
  });
});
