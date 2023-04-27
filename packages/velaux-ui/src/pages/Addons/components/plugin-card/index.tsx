import React from 'react';
import { FaLink } from 'react-icons/fa';

import './index.less';

import { Box, Button, Card, Grid, Tag } from '@alifd/next';
import i18n from "i18next";
import { checkImage } from "../../../../utils/icon";
import { If } from '../../../../components/If';

type State = {
  iconValid: boolean
};

type Props = {
  id: string
  enabled?: boolean
  installed?: boolean
  icon?: string
  description?: string
  url?: string

  // default empty array
  tags: string[]
  history?: {
    push: (path: string, state?: any) => void;
    location: {
      pathname: string;
    };
  };
  onInstall: (id: string, url: string) => void
};


class PluginCard extends React.Component<Props, State> {
  static defaultProps = {
    tags: [],
  }

  constructor(props: Props) {
    super(props);
    this.state = {
      iconValid: false,
    };
  }

  setValid = (valid: boolean) => {
    this.setState((preState) => {
      return { ...preState, iconValid: valid }
    })
  }

  componentDidMount() {
    if (this.props.icon) {
      checkImage(this.props.icon, this.setValid)
    }
  }

  componentDidUpdate(prevProps: Readonly<Props>) {
    if (prevProps.icon !== this.props.icon && this.props.icon) {
      checkImage(this.props.icon, this.setValid)
    }
  }

  handleGoToPage = (id: string) => {
    this.props.history?.push(`/plugins/${id}`)
  }

  handleInstall = (id: string, url: string) => {
    this.props.onInstall(id, url)
  }

  handleGoToPluginConfig = (id: string) => {
    if (this.props.installed) {
      this.props.history?.push(`/plugin-config/${id}`)
    }
  }


  render() {
    const { Row, Col } = Grid;
    const {
      id,
      icon,
      tags,
      description,
      enabled,
      installed,
      url,
    } = this.props;
    const nameUpper = (name: string) => {
      return name
        .split('-')
        .map((sep) => {
          if (sep.length > 0) {
            return sep.toUpperCase()[0];
          }
          return sep;
        })
        .toString()
        .replace(',', '');
    };

    const renderIcon = (name: string, icon?: string) => {
      if (this.state.iconValid) {
        return <img src={icon} />;
      } else {
        return (
          <div
            style={{
              display: 'inline-block',
              verticalAlign: 'middle',
              padding: `2px 4px`,
              width: '60px',
              height: '60px',
              borderRadius: '50%',
              backgroundColor: '#ebf0ff',
              textAlign: 'center',
              lineHeight: '60px',
            }}
          >
            <span style={{ color: '#1b58f4', fontSize: `2em` }}>{nameUpper(name)}</span>
          </div>
        );
      }
    }

    return (
      <div className={'plugin-card'}>
        <a onClick={() => this.handleGoToPluginConfig(id)}>
          <Card style={{ border: 'none' }} contentHeight={180}>
            <Box align={"center"} spacing={8} direction={'row'}>
              <Box>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {renderIcon(id, icon)}
                </div>
              </Box>
              <Box>
                {enabled &&
                    <a onClick={(e) => {
                      e.stopPropagation();
                      this.handleGoToPage(id)
                    }}>
                      <span style={{ fontSize: '20px' }}>{id}</span><FaLink />
                    </a>
                }
                {
                  !enabled && <div className={'font-color-keep'} style={{ fontSize: '20px' }}>{id}</div>
                }
              </Box>
            </Box>
            <div className={'plugin-card-content'}>
              <Row id={'desc'} className={'plugin-desc'}>
                <h4 className={'font-size-14 font-color-keep'}>{description ? description : "No descriptions"}</h4>
              </Row>
              <Row id={'tags'} gutter={1}>
                <Col span={18}>
                  <Box direction={'row'} wrap={true} spacing={[4, 4]}>
                    {tags.map((t: string) => {
                        return (
                          <div className={'hover-none'}>
                            <Tag size={'small'} className={'tag'} type={'normal'}>{t}</Tag>
                          </div>
                        );
                      }
                    )}
                    {
                      [1, 2, 3, 4].map((i) => {
                        return (
                          <div className={'hover-none'}>
                            <Tag size={'small'} className={'tag'} type={'normal'}>{'test' + i}</Tag>
                          </div>
                        )
                      })}
                  </Box>
                </Col>
                <Col span={6}>
                  {url && url !== "" && !installed &&
                      <Box align={'flex-end'}>
                        <Button className={'hover-auto'} type={"primary"} onClick={(e) => {
                          e.stopPropagation();
                          this.handleInstall(id, url)
                        }}>{i18n.t('Install')}</Button>
                      </Box>
                  }
                  {installed &&
                      <Box direction={'row'} justify={"flex-end"} align={"center"} style={{ marginLeft: 'auto' }}>
                        <If condition={enabled}>
                          <span className="circle circle-success" />
                          <span className={'font-color-info'}>Enabled</span>
                        </If>
                        <If condition={!enabled}>
                          <span className="circle circle-success" />
                          <span className={'font-color-info'}>Installed</span>
                        </If>
                      </Box>
                  }
                </Col>
              </Row>
            </div>
          </Card>
        </a>
      </div>

    );
  }
}

export default PluginCard;