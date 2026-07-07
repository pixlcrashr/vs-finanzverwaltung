package model

type CasbinRule struct {
	ID    uint   `gorm:"primaryKey;autoIncrement"`
	Ptype string `gorm:"not null;index:idx_casbin_rule_ptype"`
	V0    string `gorm:"size:100;default:null;index:idx_casbin_rule_v0"`
	V1    string `gorm:"size:100;default:null;index:idx_casbin_rule_v1"`
	V2    string `gorm:"size:100;default:null;index:idx_casbin_rule_v2"`
	V3    string `gorm:"size:100;default:null"`
	V4    string `gorm:"size:100;default:null"`
	V5    string `gorm:"size:100;default:null"`
}

func (CasbinRule) TableName() string { return "casbin_rule" }
