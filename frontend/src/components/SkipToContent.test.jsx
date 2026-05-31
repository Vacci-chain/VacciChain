import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import SkipToContent from './SkipToContent';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key, options) => options?.defaultValue || key,
  }),
}));

describe('SkipToContent', () => {
  beforeEach(() => {
    // Create a mock main content element
    const mainContent = document.createElement('main');
    mainContent.id = 'main-content';
    mainContent.tabIndex = -1;
    document.body.appendChild(mainContent);
  });

  afterEach(() => {
    // Clean up
    const mainContent = document.getElementById('main-content');
    if (mainContent) {
      document.body.removeChild(mainContent);
    }
  });

  it('renders the skip link', () => {
    render(<SkipToContent />);
    const link = screen.getByText('Skip to main content');
    expect(link).toBeInTheDocument();
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('#main-content');
  });

  it('has correct aria-label', () => {
    render(<SkipToContent />);
    const link = screen.getByLabelText('Skip to main content');
    expect(link).toBeInTheDocument();
  });

  it('is visually hidden by default', () => {
    render(<SkipToContent />);
    const link = screen.getByText('Skip to main content');
    expect(link.style.top).toBe('-100px');
  });

  it('becomes visible on focus', () => {
    render(<SkipToContent />);
    const link = screen.getByText('Skip to main content');
    
    fireEvent.focus(link);
    expect(link.style.top).toBe('0px');
  });

  it('becomes hidden on blur', () => {
    render(<SkipToContent />);
    const link = screen.getByText('Skip to main content');
    
    fireEvent.focus(link);
    expect(link.style.top).toBe('0px');
    
    fireEvent.blur(link);
    expect(link.style.top).toBe('-100px');
  });

  it('focuses main content when clicked', () => {
    render(<SkipToContent />);
    const link = screen.getByText('Skip to main content');
    const mainContent = document.getElementById('main-content');
    
    const focusSpy = vi.spyOn(mainContent, 'focus');
    const scrollSpy = vi.spyOn(mainContent, 'scrollIntoView');
    
    fireEvent.click(link);
    
    expect(focusSpy).toHaveBeenCalled();
    expect(scrollSpy).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });
  });

  it('prevents default link behavior when clicked', () => {
    render(<SkipToContent />);
    const link = screen.getByText('Skip to main content');
    
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
    
    link.dispatchEvent(event);
    
    expect(preventDefaultSpy).toHaveBeenCalled();
  });
});
