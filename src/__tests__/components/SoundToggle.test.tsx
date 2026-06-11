import { render, fireEvent } from '@testing-library/react';
import { SoundToggle } from '../../components/SoundToggle';
import { useSoundStore } from '../../store/soundStore';

jest.mock('../../store/soundStore', () => ({
  useSoundStore: jest.fn(),
}));

jest.mock('../../hooks/useSound', () => ({
  useSound: () => ({
    playClick: jest.fn(),
  }),
}));

describe('SoundToggle', () => {
  const mockToggleSound = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useSoundStore as unknown as jest.Mock).mockReturnValue({
      isSoundEnabled: true,
      toggleSound: mockToggleSound,
    });
  });

  it('should render without crashing', () => {
    const { container } = render(<SoundToggle />);
    expect(container.querySelector('.icon-btn')).toBeInTheDocument();
  });

  it('should call toggleSound when clicked', () => {
    const { container } = render(<SoundToggle />);
    
    const button = container.querySelector('.icon-btn');
    if (button) {
      fireEvent.click(button);
      expect(mockToggleSound).toHaveBeenCalledTimes(1);
    }
  });
});