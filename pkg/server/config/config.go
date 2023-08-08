/*
Copyright 2022 The KubeVela Authors.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

	http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

package config

import (
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/kubevela/pkg/util/profiling"
	"github.com/spf13/pflag"

	"github.com/kubevela/velaux/pkg/server/infrastructure/datastore"
)

// Config config for server
type Config struct {
	// api server bind address
	BindAddr string
	// monitor metric path
	MetricPath string

	// Datastore config
	Datastore datastore.Config

	// LeaderConfig for leader election
	LeaderConfig leaderConfig

	// AddonCacheTime is how long between two cache operations
	AddonCacheTime time.Duration

	// DisableStatisticCronJob close the calculate system info cronJob
	DisableStatisticCronJob bool

	// KubeBurst the burst of kube client
	KubeBurst int

	// KubeQPS the QPS of kube client
	KubeQPS float64

	// WorkflowVersion is the version of workflow
	WorkflowVersion string

	PluginConfig PluginConfig

	DexServerURL string

	// ExitOnLostLeader will exit the process if this server lost the leader election, set this to true for debugging
	ExitOnLostLeader bool
}

// PluginConfig the plugin directory config
type PluginConfig struct {
	CorePluginPath   string
	CustomPluginPath []string
}

type leaderConfig struct {
	ID       string
	LockName string
	Duration time.Duration
}

// NewConfig  returns a Config struct with default values
func NewConfig() *Config {
	return &Config{
		BindAddr:   "0.0.0.0:8000",
		MetricPath: "/metrics",
		Datastore: datastore.Config{
			Type:     "kubeapi",
			Database: "kubevela",
			URL:      "",
		},
		LeaderConfig: leaderConfig{
			ID:       uuid.New().String(),
			LockName: "apiserver-lock",
			Duration: time.Second * 5,
		},
		AddonCacheTime:          time.Minute * 10,
		DisableStatisticCronJob: false,
		KubeQPS:                 100,
		KubeBurst:               300,
		PluginConfig: PluginConfig{
			CorePluginPath:   "core-plugins",
			CustomPluginPath: []string{"plugins"},
		},
		DexServerURL:     "http://dex.vela-system:5556",
		ExitOnLostLeader: true,
	}
}

// Validate validate generic server run options
func (s *Config) Validate() []error {
	var errs []error

	if s.Datastore.Type != "mongodb" && s.Datastore.Type != "kubeapi" && s.Datastore.Type != "postgres" {
		errs = append(errs, fmt.Errorf("not support datastore type %s", s.Datastore.Type))
	}

	return errs
}

// AddFlags adds flags to the specified FlagSet
func (s *Config) AddFlags(fs *pflag.FlagSet, c *Config) {
	fs.StringVar(&s.BindAddr, "bind-addr", c.BindAddr, "The bind address used to serve the http APIs.")
	fs.StringVar(&s.MetricPath, "metrics-path", c.MetricPath, "The path to expose the metrics.")
	fs.StringVar(&s.Datastore.Type, "datastore-type", c.Datastore.Type, "Metadata storage driver type, support kubeapi and mongodb")
	fs.StringVar(&s.Datastore.Database, "datastore-database", c.Datastore.Database, "Metadata storage database name, takes effect when the storage driver is mongodb.")
	fs.StringVar(&s.Datastore.URL, "datastore-url", c.Datastore.URL, "Metadata storage database url,takes effect when the storage driver is mongodb.")
	fs.StringVar(&s.LeaderConfig.ID, "id", c.LeaderConfig.ID, "the holder identity name")
	fs.StringVar(&s.LeaderConfig.LockName, "lock-name", c.LeaderConfig.LockName, "the lease lock resource name")
	fs.DurationVar(&s.LeaderConfig.Duration, "duration", c.LeaderConfig.Duration, "the lease lock resource name")
	fs.DurationVar(&s.AddonCacheTime, "addon-cache-duration", c.AddonCacheTime, "how long between two addon cache operation")
	fs.BoolVar(&s.DisableStatisticCronJob, "disable-statistic-cronJob", c.DisableStatisticCronJob, "close the system statistic info calculating cronJob")
	fs.Float64Var(&s.KubeQPS, "kube-api-qps", c.KubeQPS, "the qps for kube clients. Low qps may lead to low throughput. High qps may give stress to api-server.")
	fs.IntVar(&s.KubeBurst, "kube-api-burst", c.KubeBurst, "the burst for kube clients. Recommend setting it qps*3.")
	fs.StringVar(&s.WorkflowVersion, "workflow-version", c.WorkflowVersion, "the version of workflow to meet controller requirement.")
	fs.StringVar(&s.DexServerURL, "dex-server", c.DexServerURL, "the URL of the dex server.")
	fs.StringArrayVar(&s.PluginConfig.CustomPluginPath, "plugin-path", c.PluginConfig.CustomPluginPath, "the path of the plugin directory")
	fs.BoolVar(&s.ExitOnLostLeader, "exit-on-lost-leader", c.ExitOnLostLeader, "exit the process if this server lost the leader election")
	profiling.AddFlags(fs)
}
