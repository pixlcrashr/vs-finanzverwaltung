package cfg

import (
	"fmt"
	"strings"

	"github.com/spf13/viper"
)

type Config struct {
	Server   Server   `mapstructure:"server"`
	Database Database `mapstructure:"database"`
	Auth     Auth     `mapstructure:"auth"`
	Html2Pdf Html2Pdf `mapstructure:"html2pdf"`
	App      App      `mapstructure:"app"`
	CORS     CORS     `mapstructure:"cors"`
}

type Server struct {
	Address string `mapstructure:"addr"`
}

type Database struct {
	URL string `mapstructure:"url"`
}

type Auth struct {
	Secret string      `mapstructure:"secret"`
	GitLab GitLabOAuth `mapstructure:"gitlab"`
}

type GitLabOAuth struct {
	ClientID     string `mapstructure:"client-id"`
	ClientSecret string `mapstructure:"client-secret"`
	Issuer       string `mapstructure:"issuer"`
}

type Html2Pdf struct {
	URL string `mapstructure:"url"`
}

type App struct {
	OrganisationName string `mapstructure:"organisation-name"`
	Version          string `mapstructure:"version"`
}

type CORS struct {
	Enabled          bool     `mapstructure:"enabled"`
	AllowOrigins     []string `mapstructure:"allow-origins"`
	AllowMethods     []string `mapstructure:"allow-methods"`
	AllowHeaders     []string `mapstructure:"allow-headers"`
	ExposeHeaders    []string `mapstructure:"expose-headers"`
	AllowCredentials bool     `mapstructure:"allow-credentials"`
	MaxAge           int      `mapstructure:"max-age"`
}

func Load(cfgFile string) (*Config, error) {
	if cfgFile != "" {
		viper.SetConfigFile(cfgFile)
	} else {
		viper.SetConfigName("config")
		viper.SetConfigType("yaml")
		viper.AddConfigPath(".")
		viper.AddConfigPath("$HOME/.vsfv")
		viper.AddConfigPath("/etc/vsfv")
	}

	viper.SetEnvPrefix("VSFV")
	viper.SetEnvKeyReplacer(strings.NewReplacer(".", "_", "-", "_"))
	viper.AutomaticEnv()

	viper.SetDefault("server.addr", "127.0.0.1:8080")
	viper.SetDefault("html2pdf.url", "http://127.0.0.1:8082")
	viper.SetDefault("app.version", "dev")
	viper.SetDefault("cors.enabled", false)
	viper.SetDefault("cors.allow-origins", []string{"*"})
	viper.SetDefault("cors.allow-methods", []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"})
	viper.SetDefault("cors.allow-headers", []string{"Origin", "Content-Type", "Accept", "Authorization"})
	viper.SetDefault("cors.expose-headers", []string{})
	viper.SetDefault("cors.allow-credentials", false)
	viper.SetDefault("cors.max-age", 300)

	if err := viper.ReadInConfig(); err != nil {
		if _, ok := err.(viper.ConfigFileNotFoundError); !ok {
			return nil, fmt.Errorf("reading config: %w", err)
		}
	}

	var cfg Config
	if err := viper.Unmarshal(&cfg); err != nil {
		return nil, fmt.Errorf("unmarshalling config: %w", err)
	}

	return &cfg, nil
}
