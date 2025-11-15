import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '@/components/ui/button';

describe('Button Component', () => {
  describe('Rendering', () => {
    it('should render button with text', () => {
      render(<Button data-testid="btn-test">Click Me</Button>);

      const button = screen.getByTestId('btn-test');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Click Me');
    });

    it('should render button with default variant', () => {
      render(<Button data-testid="btn-test">Default Button</Button>);

      const button = screen.getByTestId('btn-test');
      expect(button).toBeInTheDocument();
    });

    it('should render button with destructive variant', () => {
      render(
        <Button data-testid="btn-test" variant="destructive">
          Delete
        </Button>
      );

      const button = screen.getByTestId('btn-test');
      expect(button).toBeInTheDocument();
      expect(button).toHaveTextContent('Delete');
    });

    it('should render button with outline variant', () => {
      render(
        <Button data-testid="btn-test" variant="outline">
          Outline
        </Button>
      );

      const button = screen.getByTestId('btn-test');
      expect(button).toBeInTheDocument();
    });
  });

  describe('Interactions', () => {
    it('should handle click events', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button data-testid="btn-test" onClick={handleClick}>
          Click Me
        </Button>
      );

      const button = screen.getByTestId('btn-test');
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button data-testid="btn-test" onClick={handleClick} disabled>
          Click Me
        </Button>
      );

      const button = screen.getByTestId('btn-test');
      await user.click(button);

      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(
        <Button data-testid="btn-test" disabled>
          Click Me
        </Button>
      );

      const button = screen.getByTestId('btn-test');
      expect(button).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have correct role', () => {
      render(<Button data-testid="btn-test">Click Me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
    });

    it('should be keyboard accessible', async () => {
      const handleClick = jest.fn();
      const user = userEvent.setup();

      render(
        <Button data-testid="btn-test" onClick={handleClick}>
          Click Me
        </Button>
      );

      const button = screen.getByTestId('btn-test');
      button.focus();

      await user.keyboard('{Enter}');
      expect(handleClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('Type attribute', () => {
    it('should have type="submit" when specified', () => {
      render(
        <Button data-testid="btn-test" type="submit">
          Submit
        </Button>
      );

      const button = screen.getByTestId('btn-test');
      expect(button).toHaveAttribute('type', 'submit');
    });

    it('should have type="button" when specified', () => {
      render(
        <Button data-testid="btn-test" type="button">
          Click Me
        </Button>
      );

      const button = screen.getByTestId('btn-test');
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
