package tui

import (
	"fmt"
	"strings"
	"unicode"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type passwordState int

const (
	statePassword passwordState = iota
	stateConfirm
	stateDone
	stateMismatch
)

type passwordModel struct {
	state         passwordState
	password      string
	confirm       string
	cursor        int
	mismatch      bool
	result        string
	err           error
	confirmCursor int
}

var (
	promptStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("99"))
	errorStyle  = lipgloss.NewStyle().Foreground(lipgloss.Color("196"))
	dotStyle    = lipgloss.NewStyle().Foreground(lipgloss.Color("240"))
)

// PasswordPrompt runs a bubbletea program that asks for a password twice
// (with confirmation) and returns the entered password. Input is hidden
// (displayed as dots), similar to SSH password prompts.
func PasswordPrompt(label string) (string, error) {
	p := tea.NewProgram(initialModel(label))
	m, err := p.Run()
	if err != nil {
		return "", fmt.Errorf("running password prompt: %w", err)
	}

	model, ok := m.(passwordModel)
	if !ok {
		return "", fmt.Errorf("unexpected model type from password prompt")
	}

	if model.err != nil {
		return "", model.err
	}

	if model.state != stateDone {
		return "", fmt.Errorf("password prompt cancelled")
	}

	return model.result, nil
}

func initialModel(label string) passwordModel {
	return passwordModel{
		state: statePassword,
	}
}

func (m passwordModel) Init() tea.Cmd {
	return nil
}

func (m passwordModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyCtrlC, tea.KeyEsc:
			m.err = fmt.Errorf("cancelled by user")
			return m, tea.Quit

		case tea.KeyEnter:
			if m.state == statePassword {
				if len(m.password) == 0 {
					return m, nil
				}
				m.state = stateConfirm
				m.confirmCursor = 0
				return m, nil
			}
			if m.state == stateConfirm {
				if m.password == m.confirm {
					m.result = m.password
					m.state = stateDone
					return m, tea.Quit
				}
				m.state = stateMismatch
				return m, nil
			}
			if m.state == stateMismatch {
				m.password = ""
				m.confirm = ""
				m.cursor = 0
				m.confirmCursor = 0
				m.state = statePassword
				return m, nil
			}

		case tea.KeyBackspace:
			if m.state == statePassword && m.cursor > 0 {
				m.password = m.password[:m.cursor-1]
				m.cursor--
			}
			if m.state == stateConfirm && m.confirmCursor > 0 {
				m.confirm = m.confirm[:m.confirmCursor-1]
				m.confirmCursor--
			}

		default:
			if msg.Type == tea.KeyRunes || msg.Type == tea.KeySpace {
				var filtered []rune
				for _, r := range msg.Runes {
					if unicode.IsPrint(r) {
						filtered = append(filtered, r)
					}
				}
				if len(filtered) > 0 {
					ch := string(filtered)
					if m.state == statePassword {
						m.password += ch
						m.cursor += len(filtered)
					}
					if m.state == stateConfirm {
						m.confirm += ch
						m.confirmCursor += len(filtered)
					}
				}
			}
		}
	}
	return m, nil
}

func (m passwordModel) View() string {
	var b strings.Builder

	switch m.state {
	case statePassword:
		b.WriteString(promptStyle.Render("Enter password: "))
		b.WriteString(dotStyle.Render(strings.Repeat("•", len(m.password))))
		b.WriteString("▎")
		b.WriteString("\n\n  (press Enter to confirm, Esc to cancel)")

	case stateConfirm:
		b.WriteString(promptStyle.Render("Enter password: "))
		b.WriteString(dotStyle.Render(strings.Repeat("•", len(m.password))))
		b.WriteString("\n")
		b.WriteString(promptStyle.Render("Confirm password: "))
		b.WriteString(dotStyle.Render(strings.Repeat("•", len(m.confirm))))
		b.WriteString("▎")
		b.WriteString("\n\n  (press Enter to confirm, Esc to cancel)")

	case stateMismatch:
		b.WriteString(promptStyle.Render("Enter password: "))
		b.WriteString(dotStyle.Render(strings.Repeat("•", len(m.password))))
		b.WriteString("\n")
		b.WriteString(promptStyle.Render("Confirm password: "))
		b.WriteString(dotStyle.Render(strings.Repeat("•", len(m.confirm))))
		b.WriteString("\n\n")
		b.WriteString(errorStyle.Render("✗ Passwords do not match. Press Enter to try again."))

	case stateDone:
		b.WriteString("✓ Password set.")
	}

	return b.String()
}
