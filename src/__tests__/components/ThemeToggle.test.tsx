import { render, fireEvent } from '@testing-library/react';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useThemeStore } from '../../store/themeStore';

jest.mock('../../store/themeStore', () => ({
  useThemeStore: jest.fn(),
}));

jest.mock('../../hooks/useSound', () => ({
  useSound: () => ({
    playClick: jest.fn(),
  }),
}));

describe('ThemeToggle', () => {
  const mockToggleTheme = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useThemeStore as unknown as jest.Mock).mockReturnValue({
      theme: 'dark',
      toggleTheme: mockToggleTheme,
    });
  });

  it('should render without crashing', () => {
    const { container } = render(<ThemeToggle />);
    expect(container.querySelector('.icon-btn')).toBeInTheDocument();
  });

  it('should call toggleTheme when clicked', () => {
    const { container } = render(<ThemeToggle />);
    
    const button = container.querySelector('.icon-btn');
    if (button) {
      fireEvent.click(button);
      expect(mockToggleTheme).toHaveBeenCalledTimes(1);
    }
  });
});