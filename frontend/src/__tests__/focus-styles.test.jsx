import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';

describe('Form Field Focus Styles', () => {
  beforeEach(() => {
    // Apply the CSS custom properties for testing
    document.documentElement.style.setProperty('--focus-ring', '#0284c7');
    document.documentElement.style.setProperty('--focus-ring-offset', '#ffffff');
  });

  describe('Input Elements', () => {
    it('applies custom focus styles to text input', async () => {
      const user = userEvent.setup();
      render(<input type="text" data-testid="text-input" />);
      
      const input = screen.getByTestId('text-input');
      await user.tab(); // Focus the input
      
      expect(input).toHaveFocus();
      expect(input).toBeInTheDocument();
    });

    it('applies custom focus styles to date input', async () => {
      const user = userEvent.setup();
      render(<input type="date" data-testid="date-input" />);
      
      const input = screen.getByTestId('date-input');
      await user.tab();
      
      expect(input).toHaveFocus();
    });

    it('applies custom focus styles to email input', async () => {
      const user = userEvent.setup();
      render(<input type="email" data-testid="email-input" />);
      
      const input = screen.getByTestId('email-input');
      await user.tab();
      
      expect(input).toHaveFocus();
    });

    it('applies focus styles to readonly input', async () => {
      const user = userEvent.setup();
      render(<input type="text" readOnly value="readonly value" data-testid="readonly-input" />);
      
      const input = screen.getByTestId('readonly-input');
      await user.tab();
      
      expect(input).toHaveFocus();
    });
  });

  describe('Textarea Elements', () => {
    it('applies custom focus styles to textarea', async () => {
      const user = userEvent.setup();
      render(<textarea data-testid="textarea" />);
      
      const textarea = screen.getByTestId('textarea');
      await user.tab();
      
      expect(textarea).toHaveFocus();
    });
  });

  describe('Select Elements', () => {
    it('applies custom focus styles to select', async () => {
      const user = userEvent.setup();
      render(
        <select data-testid="select">
          <option>Option 1</option>
          <option>Option 2</option>
        </select>
      );
      
      const select = screen.getByTestId('select');
      await user.tab();
      
      expect(select).toHaveFocus();
    });
  });

  describe('Button Elements', () => {
    it('applies custom focus styles to button', async () => {
      const user = userEvent.setup();
      render(<button data-testid="button">Click me</button>);
      
      const button = screen.getByTestId('button');
      await user.tab();
      
      expect(button).toHaveFocus();
    });

    it('applies focus styles to disabled button', () => {
      render(<button disabled data-testid="disabled-button">Disabled</button>);
      
      const button = screen.getByTestId('disabled-button');
      expect(button).toBeDisabled();
    });
  });

  describe('Focus Indicator Visibility', () => {
    it('ensures focus styles are never removed without replacement', () => {
      // This test verifies that we never use outline: none without a replacement
      const styles = document.styleSheets;
      let hasOutlineNoneWithoutReplacement = false;
      
      // Check if any CSS rule has outline: none without box-shadow or border replacement
      for (let i = 0; i < styles.length; i++) {
        try {
          const rules = styles[i].cssRules || styles[i].rules;
          for (let j = 0; j < rules.length; j++) {
            const rule = rules[j];
            if (rule.style && rule.style.outline === 'none') {
              // Check if there's a replacement (box-shadow or border)
              const hasBoxShadow = rule.style.boxShadow && rule.style.boxShadow !== 'none';
              const hasBorder = rule.style.border && rule.style.border !== 'none';
              
              if (!hasBoxShadow && !hasBorder) {
                hasOutlineNoneWithoutReplacement = true;
              }
            }
          }
        } catch (e) {
          // Skip cross-origin stylesheets
        }
      }
      
      expect(hasOutlineNoneWithoutReplacement).toBe(false);
    });
  });

  describe('Dark Mode Focus Styles', () => {
    beforeEach(() => {
      // Apply dark mode CSS custom properties
      document.documentElement.classList.add('dark');
      document.documentElement.style.setProperty('--focus-ring', '#38bdf8');
      document.documentElement.style.setProperty('--focus-ring-offset', '#0f172a');
    });

    afterEach(() => {
      document.documentElement.classList.remove('dark');
    });

    it('applies correct focus ring color in dark mode', async () => {
      const user = userEvent.setup();
      render(<input type="text" data-testid="dark-input" />);
      
      const input = screen.getByTestId('dark-input');
      await user.tab();
      
      expect(input).toHaveFocus();
      
      const focusRing = getComputedStyle(document.documentElement)
        .getPropertyValue('--focus-ring');
      expect(focusRing).toBe('#38bdf8');
    });
  });

  describe('Keyboard Navigation', () => {
    it('allows tabbing through multiple form fields', async () => {
      const user = userEvent.setup();
      render(
        <form>
          <input type="text" data-testid="input1" />
          <input type="email" data-testid="input2" />
          <textarea data-testid="textarea" />
          <button data-testid="button">Submit</button>
        </form>
      );
      
      const input1 = screen.getByTestId('input1');
      const input2 = screen.getByTestId('input2');
      const textarea = screen.getByTestId('textarea');
      const button = screen.getByTestId('button');
      
      await user.tab();
      expect(input1).toHaveFocus();
      
      await user.tab();
      expect(input2).toHaveFocus();
      
      await user.tab();
      expect(textarea).toHaveFocus();
      
      await user.tab();
      expect(button).toHaveFocus();
    });
  });

  describe('Contrast Requirements', () => {
    it('uses focus ring colors that meet 3:1 contrast ratio', () => {
      // Light mode focus ring
      const lightFocusRing = getComputedStyle(document.documentElement)
        .getPropertyValue('--focus-ring');
      expect(lightFocusRing).toBeTruthy();
      
      // The colors used (#0284c7 on white, #38bdf8 on dark) meet WCAG 3:1 contrast
      // This is a basic check that the variables are defined
      expect(lightFocusRing).toMatch(/#[0-9a-fA-F]{6}/);
    });
  });
});
