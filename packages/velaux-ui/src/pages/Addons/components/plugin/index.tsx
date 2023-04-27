import React from 'react';
import { connect } from 'dva';
import './index.less';

import { Grid, Message } from "@alifd/next";
import type { KeyValue, PluginMeta, } from '@velaux/data';
import i18n from "../../../../i18n";
import { If } from "../../../../components/If";
import Empty from "../../../../components/Empty";
import PluginCard from "../plugin-card";

type State = {
  iconValid: KeyValue<boolean>;
  currentPlugin?: PluginMeta;
  showConfig: boolean;
};

type Props = {
  dispatch: ({}) => {};
  pluginList: PluginMeta[];
  errorMessage?: string;
  history?: {
    push: (path: string, state?: any) => void;
    location: {
      pathname: string;
    };
  };
};

function pluginEnabled(p: PluginMeta) {
  return p.enabled;
}

function pluginInstalled(p: PluginMeta) {
  return !!p.info
}

function pluginUninstalled(p: PluginMeta) {
  return !pluginInstalled(p)
}

@connect((store: any) => {
  return { ...store.plugins };
})
class Plugin extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      iconValid: {},
      showConfig: false,
    };

    this.installPlugin = this.installPlugin.bind(this);
  }

  static defaultProps = {
    pluginList: [],
  }

  getPluginList = async (params = {}) => {
    this.props.dispatch({
      type: 'plugins/getPluginList',
      payload: params,
    });
  }


  installPlugin(id: string, url: string) {
    this.props.dispatch({
      type: 'plugins/installPlugin',
      payload: { id, url },
      callback: () => {
        Message.success(i18n.t("Install Success. Enabled automatically."));
      }
    });
  }

  uninstallPlugin(id: string) {
    this.props.dispatch({
      type: 'plugins/uninstallPlugin',
      payload: { id },
      callback: () => {
        Message.success(i18n.t("Uninstall Success."));
      }
    });
  }

  enablePlugin(id: string) {
    this.props.dispatch({
      type: 'plugins/enablePlugin',
      payload: { id },
      callback: () => {
        Message.success(i18n.t("Enable Success."));
      }
    });
  }

  disablePlugin(id: string) {
    this.props.dispatch({
      type: 'plugins/disablePlugin',
      payload: { id },
      callback: () => {
        Message.success(i18n.t("Disable Success."));
      }
    });
  }

  componentDidMount() {
    this.getPluginList().then(() => {
      const { pluginList } = this.props;
      if (pluginList) {
        pluginList.forEach((plugin) => {
          if (plugin.name && plugin.info?.logos?.small) {
            this.checkImage(plugin.name, plugin.info.logos.small);
          }
        });
      }
      this.sortedPlugins()
    })
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    const { pluginList } = this.props;
    if (pluginList && pluginList !== prevProps.pluginList) {
      pluginList.forEach((plugin) => {
        if (plugin.name && plugin.info?.logos?.small) {
          this.checkImage(plugin.name, plugin.info.logos.small);
        }
      });
    }
  }

  checkImage = (name: string, icon?: string) => {
    if (icon && icon !== 'none' && icon !== '') {
      const img = new Image();
      img.src = icon;
      img.onload = () => {
        this.setState((preState) => {
          preState.iconValid[name] = true;
          return preState;
        });
      }
      img.onerror = () => {
        this.setState((preState) => {
          preState.iconValid[name] = false;
          return preState;
        });
      }
    } else {
      this.setState((preState) => {
        preState.iconValid[name] = false;
        return preState;
      });
    }
  };


  sortedPlugins = () => {
    // put enabled plugin first, then installed plugin, then others
    const { pluginList } = this.props
    let enabledPlugins = pluginList.filter(pluginEnabled)
    let uninstalledPlugins = pluginList.filter(pluginUninstalled)
    let installedPlugins = pluginList.filter((p) => {
      return pluginInstalled(p) && !pluginEnabled(p)
    })
    console.log(enabledPlugins, installedPlugins, uninstalledPlugins)
    return [...enabledPlugins, ...installedPlugins, ...uninstalledPlugins]
  }

  render() {
    const { pluginList } = this.props;
    const { Row, Col } = Grid;

    return (
      <div>
        <If condition={pluginList}>
          <div style={{ marginTop: '20px' }}>
            <Row wrap={true} gutter={16}>
              {pluginList && this.sortedPlugins().map((plugin: PluginMeta, index: number) => {
                return (
                  <Col xl={4} l={6} m={8} s={12} key={index}>
                    <div style={{ marginBottom: '20px' }}>
                      <PluginCard
                        id={plugin.id}
                        icon={plugin.info?.logos?.small}
                        enabled={plugin.enabled}
                        installed={!!plugin.info}
                        description={plugin.info?.description}
                        tags={[]}
                        history={this.props.history}
                        url={plugin.url}
                        onInstall={this.installPlugin}
                      />
                    </div>
                  </Col>
                )
              })
              }
            </Row>
          </div>

        </If>
        <If condition={!pluginList || pluginList.length == 0}>
          <Empty style={{ minHeight: '400px' }} />
        </If>

      </div>
    );
  };
}

export default Plugin;
