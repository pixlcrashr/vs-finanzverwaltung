package tui

import (
	"fmt"
	"strings"
	"unicode"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

type textInputModel struct {
	label    string
	value    string
	cursor   int
	quitting bool
	err      error
}

var (
	textPromptStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("99"))
	textCursorStyle = lipgloss.NewStyle().Foreground(lipgloss.Color("213"))
)

// TextPrompt runs a bubbletea program that asks for a text value.
// Returns the entered text, or an error if cancelled.
func TextPrompt(label string) (string, error) {
	p := tea.NewProgram(initialTextInputModel(label))
	m, err := p.Run()
	if err != nil {
		return "", fmt.Errorf("running text prompt: %w", err)
	}

	model, ok := m.(textInputModel)
	if !ok {
		return "", fmt.Errorf("unexpected model type from text prompt")
	}

	if model.err != nil {
		return "", model.err
	}

	if model.quitting && model.value == "" {
		return "", fmt.Errorf("cancelled by user")
	}

	return model.value, nil
}

func initialTextInputModel(label string) textInputModel {
	return textInputModel{label: label}
}

func (m textInputModel) Init() tea.Cmd {
	return nil
}

func (m textInputModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.Type {
		case tea.KeyCtrlC, tea.KeyEsc:
			m.err = fmt.Errorf("cancelled by user")
			return m, tea.Quit

		case tea.KeyEnter:
			if len(m.value) > 0 {
				m.quitting = true
				return m, tea.Quit
			}

		case tea.KeyBackspace:
			if m.cursor > 0 {
				m.value = m.value[:m.cursor-1]
				m.cursor--
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
					m.value += string(filtered)
					m.cursor += len(filtered)
				}
			}
		}
	}
	return m, nil
}

func (m textInputModel) View() string {
	var b strings.Builder

	b.WriteString(textPromptStyle.Render(m.label + ": "))
	b.WriteString(m.value)
	if !m.quitting {
		b.WriteString(textCursorStyle.Render("▎"))
	}
	b.WriteString("\n\n  (press Enter to confirm, Esc to cancel)")

	return b.String()
}
