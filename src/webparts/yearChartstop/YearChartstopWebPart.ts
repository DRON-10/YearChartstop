import * as React from 'react';
import * as ReactDom from 'react-dom';
import { Version } from '@microsoft/sp-core-library';
import { BaseClientSideWebPart, IWebPartContext } from "@microsoft/sp-webpart-base";
import {
  IPropertyPaneConfiguration,
  PropertyPaneButton,
  IPropertyPaneDropdownOption,
  PropertyPaneDropdown,
  PropertyPaneSlider,
  PropertyPaneTextField
} from "@microsoft/sp-property-pane";
import * as strings from 'YearChartstopWebPartStrings';
import YeartopCharts from './components/YearChartstop';
import { IYearChartstopProps } from './IYearChartstopWebPartProps';
import { MChart } from './IYearChartstopWebPartProps';
import { IYearChartstopWebPartProps } from './IYearChartstopWebPartProps';
import { ChartConfiguration } from './IYearChartstopWebPartProps';
import ChartOptions from './ChartOptions';
import {
  SPHttpClient,
  SPHttpClientResponse
} from '@microsoft/sp-http';
import YearChartstop from './components/YearChartstop';

export interface ISPLists {
  value: ISPList[];
}

export interface ISPList {
  Title: string;
  Id: string;
}

export interface IFieldProperty extends IPropertyPaneDropdownOption {
  fieldtype: string;
}


export default class YearChartstopWebPart extends BaseClientSideWebPart<IYearChartstopWebPartProps> {

  private reactCharts: React.ReactElement<IYearChartstopProps>;

  // Columns Enable / Disable
  private colsDisabled: boolean = true;
  private listDisabled: boolean = true;
  private urlTextDisabled: boolean = true;

  //Property Dropdown Options
  private _chartThemeOptions: IPropertyPaneDropdownOption[] = [];
  private _siteOptions: IPropertyPaneDropdownOption[] = [];
  private _dropdownOptions: IPropertyPaneDropdownOption[] = [];
  private _columnOptions: IPropertyPaneDropdownOption[] = [];
  private _ListColumnOptions: Array<IPropertyPaneDropdownOption> = [];
  private _chartSizeOptions: IPropertyPaneDropdownOption[] = [
    { key: 3, text: 'Small' },
    { key: 6, text: 'Medium' },
    { key: 9, text: 'Medium-Large' },
    { key: 12, text: 'Large' }
  ];
  private _chartTypeOptions: IPropertyPaneDropdownOption[] = [
    { key: 'bar', text: 'Bar' },
    { key: 'horizontalbar', text: 'Horizontal Bar' },
    { key: 'doughnut', text: 'Doughnut' },
    { key: 'line', text: 'Line' },
    { key: 'pie', text: 'Pie' },
    { key: 'polar', text: 'Polar' },
    { key: 'radar', text: 'Radar' }
  ];
  private _chartColActions: IPropertyPaneDropdownOption[] = [
    { key: 'average', text: 'Average' },
    { key: 'count', text: 'Count' },
    { key: 'sum', text: 'Sum' }
  ];

  public constructor(context: IWebPartContext) {
    super();
  }
  private ChartThemes: ChartOptions;

  private defaultOptions: Object = {
    legend: {
      display: false,
      layout: {
        padding: 10
      },
      position: 'bottom',
      labels: {
        fontColor: 'rgba(100, 100, 100, 1.0)'
      }
    }
  };

  public defaultChartConfig(chartDesc: string): ChartConfiguration {
    var defConfig = {
      title: 'Chart Title',
      description: chartDesc,
      type: 'doughnut',
      list: null,
      Month: null,
      dataurl: this.context.pageContext.web.absoluteUrl,
      url: this.context.pageContext.web.absoluteUrl,
      other: true,
      dataUrlDisabled: true,
      colsDisabled: true,
      listsDisabled: false,
      col1: '',
      col2: '',
      act: '',
      unique: '',
      size: 12,
      options: ChartOptions.Options(),
      columns: [],
      lists: this.properties.listOptions,
      theme: "Random",
      bgColors: ChartOptions.RandomColors()['bgColors'],
      hoverColors: ChartOptions.RandomColors()['bgColors']
    };

    return defConfig;
  }

  public render(): void {
    //Initialize first demo chart
    if (!this.properties.state) {
      this.properties.state = true;
      this.properties.firstLoad = true;
      this.properties.numCharts = 1;
      this.properties.chartConfig = [];
      const firstChartConfig = this.defaultChartConfig;
      this.properties.chartConfig.push(this.defaultChartConfig('Demo Chart, Edit Web Part to Customize'));
    }
    this.getChartData();
  }

  protected get dataVersion(): Version {
    return Version.parse('1.0');
  }

  private getChartData(): void {
    const _chartData: Array<MChart> = [];
    var _count = 0;
    this.properties.chartConfig.forEach((cfg, i) => {
      if (cfg.list != null) {
        this.getData(cfg).then((response) => {
          const chart = this.calculateData(response.value, cfg);
          //console.log(":::::::");
        //  console.log(chart);
          const _chart: MChart = { data: chart['data'], labels: chart['labels'], config: cfg, key: i };
          _chartData[i] = _chart;
          if (++_count == this.properties.chartConfig.length) { this.getCharts(_chartData); }
        });
      } else {
        const _chart: MChart = { data: ChartOptions._sampleData, labels: ChartOptions._sampleCols, config: cfg, key: i };
        _chartData[i] = _chart;
        if (++_count == this.properties.chartConfig.length) { this.getCharts(_chartData); }
      }
    });
  }

  private getCharts(charts: Array<MChart>): void {
    const chartArea: React.ReactElement<IYearChartstopProps> = React.createElement(
      YearChartstop, {
      description: this.properties.description,
      title: this.properties.description,
      state: this.properties.state,
      config: {},
      context: this.context,
      data: {},
      charts: charts
    });
    ReactDom.render(chartArea, this.domElement);
  }

  private calculateData(data: Array<Object>, config: ChartConfiguration): Object {
    var values: Array<number> = [];
    var username: Array<String> = [];
    var labels: Object = this.getUnique(data, config);
    var dataVal: Array<Array<any>> = this.getValues(data, labels['unique'], config);

    //console.log(dataVal);
    function compare (a,b)
    {
      return b.length - a.length;

    }
   dataVal.sort(compare);
    var newArray = dataVal.slice(0,5);
    
  // console.log(newArray);
    /*console.log("***********");
    console.log(labels);*/
    switch (config.act) {
      case 'sum':
        newArray.forEach((vals, i) => {
          values[i] = 0;
          vals.forEach((val) => {
            values[i] += parseFloat(val);
          });
        });
        break;
      case 'average':
        newArray.forEach((vals, i) => {
          values[i] = 0;
          vals.forEach((val) => {
            values[i] += parseFloat(val);
          });
          if (values[i] != 0) {
            values[i] = values[i] / vals.length;
          }
        });
        break;
      case 'count':
        newArray.forEach((vals) => {
          values.push(vals.length);
          username.push(vals[0]);
          //console.log("vals");
          //console.log(username);
        });
        break;
      default:
        values = [100, 250, 90, 300];
        break;
    }
   // console.log("Labels");
    //console.log(typeof(values));
    return { data: values, labels: username };
  }

  private getUnique(data: Array<Object>, config: ChartConfiguration): Object {
    const chLabels: Object = { unique: [], labels: [] };
    
    data.forEach((item) => {
      if (chLabels['unique'].indexOf(item[config.unique]) == -1 && item[config.unique] != null && item[config.unique] != "") {
        chLabels['unique'].push(item[config.unique]);
        //if term use VAlue
        chLabels['labels'].push(this.getLabel(item, config.col1));
      }
    });
    //console.log("^^^^^");
    //console.log(chLabels);
    return chLabels;
    
  }

  private getLabel(item: Object, col: string) {
    if (!!item[col] && !!item[col]['WssId'] && !!item["TaxCatchAll"] && item["TaxCatchAll"].length > 0) {
      //Filter because you can have more Fields from this type to select the right value
      const wssid: number = item[col]['WssId'];
      const terms = (item["TaxCatchAll"]).filter((x) => x.ID === wssid);
      if (!!terms && terms.length > 0) {
        return terms[0].Term;
      }
      return 'TermLabel not Found';
      
    }
    //TODO HyperLink
    //lookup user
   
//console.log("@@@@@@@@@@@");
//console.log(item[col]);
    return item[col];
  }

  private getValues(data: Array<Object>, unique: Array<string>, config: ChartConfiguration): Array<Array<any>> {

    const values: Object = {};
    const vals: Array<Array<any>> = [[]];
    unique.forEach((col, i) => {
      values[col] = [];
      vals[i] = [];
      data.forEach((item, _i) => {
        if (item[config.unique] == col) {
          vals[i].push(item[config.col2]);
        }
      });
    });
    
  //console.log("++++++");
   //console.log( vals);
    return vals;
  }

  protected onPropertyPaneFieldChanged(propertyPath: string, oldValue: any, newValue: any): void {
    var pPath = propertyPath;
    var pPathInd = propertyPath[12];

    if (pPath === 'numCharts' && oldValue != newValue) {
      if (this.properties.chartConfig.length < newValue) {
        while (this.properties.chartConfig.length < newValue) {
          this.properties.chartConfig.push(this.defaultChartConfig('Chart Description'));
        }
      } else if (this.properties.chartConfig.length > newValue) {
        while (newValue < this.properties.chartConfig.length) {
          this.properties.chartConfig.pop();
        }
      }
    }

    if (propertyPath.indexOf('[') != -1) {
      pPath = propertyPath.substring(16).replace('\"]', '');
    }
    if (pPath === 'url' && newValue == 'other' && (oldValue != newValue)) {
      this.urlTextDisabled = false;
      this.properties.chartConfig[pPathInd].dataUrlDisabled = false;
      this.properties.chartConfig[pPathInd].dataurl = oldValue;
    }
    if (pPath === 'url' && newValue != 'other' && (oldValue != newValue)) {
      this.properties.chartConfig[pPathInd].dataurl = newValue;
      this.properties.chartConfig[pPathInd].dataUrlDisabled = true;
    }
    if ((pPath === 'url' && (newValue != oldValue)) || (pPath === 'dataurl' && (newValue != oldValue))) {
      this._updateListTitles(newValue, this.properties.chartConfig[pPathInd]);
      this.properties.chartConfig[pPathInd]['other'] = true;
      this.properties.state = true;
    }
    if (pPath === 'list' && (newValue != oldValue)) {
      var siteUrl = this.properties.chartConfig[pPathInd]['dataurl'];
      this._updateListColumns(siteUrl, newValue, this.properties.chartConfig[pPathInd]);
      this.properties.chartConfig[pPathInd].colsDisabled = false;
    }
    if (pPath === 'theme' && (newValue != oldValue)) {
      const newTheme = ChartOptions.RandomColors();
      this.properties.chartConfig[pPathInd].bgColors = newTheme['bgColors'];
      this.properties.chartConfig[pPathInd].hoverColors = newTheme['hoverColors'];
    }
    if (pPath === 'col1' && (newValue != oldValue)) {
      this.properties.chartConfig[pPathInd].hasTaxField = false;
      if (!!newValue
        && !!this.properties.chartConfig[pPathInd].columns
        && this.properties.chartConfig[pPathInd].columns.length > 0
      ) {
        const selects = this.properties.chartConfig[pPathInd].columns.filter(f => f.key === newValue);
        if (selects.length > 0) {
          const selected = selects[0];

          this.properties.chartConfig[pPathInd].hasTaxField = selected.fieldtype === 'TaxonomyFieldType';
        }
      }
    }
    //col1
    this.context.propertyPane.refresh();
    this.render();
  }

  protected onPropertyPaneConfigurationStart(): void {

    if (this.properties.firstLoad || this.properties.chartConfig[0].columns.length <= 0 || this.properties.chartConfig[0].list.length <= 0) {
      this.context.statusRenderer.displayLoadingIndicator(this.domElement, 'First Time Configuration');

      this.properties.firstLoad = false;
      this._getSiteRootWeb()
        .then((response0) => {
          this._getSites(response0['Url'])
            .then((response) => {
              var sites: IPropertyPaneDropdownOption[] = [];
              sites.push({ key: this.context.pageContext.web.absoluteUrl, text: 'This Site' });
              sites.push({ key: 'other', text: 'Other Site (Specify Url)' });
              for (var _key in response.value) {
                if (this.context.pageContext.web.absoluteUrl != response.value[_key]['Url']) {
                  sites.push({ key: response.value[_key]['Url'], text: response.value[_key]['Title'] });
                }
              }
              this._siteOptions = sites;
              this.properties.siteOptions = sites;

              this._getListTitles(this.properties.chartConfig[0].dataurl)
                .then((response2) => {
                  this.properties.listOptions = response2.value.map((list: ISPList) => {
                    return {
                      key: list.Title,
                      text: list.Title
                    };
                  });
                  this.properties.chartConfig[0].lists = this.properties.listOptions;
                  this._getListColumns(this.properties.chartConfig[0].list, this.properties.chartConfig[0].url)
                    .then((response3) => {
                      var col: IPropertyPaneDropdownOption[] = [];
                      for (var __key in response3.value) {
                        col.push({ key: response3.value[__key]['InternalName'], text: response3.value[__key]['Title'] });
                      }
                      this._columnOptions = col;
                      this.colsDisabled = false;
                      this.listDisabled = false;
                      this.context.propertyPane.refresh();
                      this.context.statusRenderer.clearLoadingIndicator(this.domElement);
                      this.render();
                    });
                });
            });
        });
    }
  }

  protected getPropertyPaneConfiguration(): IPropertyPaneConfiguration {
    let columnPropertyOptions: any;

    columnPropertyOptions = [
      {
        groupName: 'General Options',
        groupFields: [
          PropertyPaneTextField('description', {
            label: 'Web Part Title'
          }),
          PropertyPaneSlider('numCharts', {
            label: 'Number of Charts',
            min: 1,
            max: 10
          }),
          PropertyPaneDropdown('dropdown', {
            label:'Status',
            options: [
              { key: 'Submitted', text: 'Submitted' },
              { key: 'Approved', text: 'Approved' },
              { key: 'Publish', text: 'Publish' }
            ]
          }),
          PropertyPaneDropdown('year', {
            label:'Year',
            options: [
              { key: '2020', text: '2020' },
              { key: '2021', text: '2021' },
              { key: '2022', text: '2022' },
              {key: '2023', text: '2023' }
            ]
          }),
         /* PropertyPaneDropdown('quarter', {
            label:'Quarter',
            options: [
              { key: 'Q1', text: 'Quarter 1' },
              { key: 'Q2', text: 'Quarter 2' },
              { key: 'Q3', text: 'Quarter 3' },
              {key: 'Q4', text: 'Quarter 4' }
            ]
          }),*/
          PropertyPaneSlider('maxResults', {
            label: 'Max # of list items',
            min: 1,
            max: 1000
          })
        ]
      }
    ];

    for (var _i = 0; _i < this.properties.numCharts; _i++) {
      columnPropertyOptions.push(
        {
          groupName: "Chart " + (_i + 1) + " Configuration",
          groupFields: [
            PropertyPaneTextField('chartConfig[' + _i + ']["title"]', {
              label: "Chart Title"
            }),
            PropertyPaneTextField('chartConfig[' + _i + ']["description"]', {
              label: "Description "
            }),
            PropertyPaneDropdown('chartConfig[' + _i + ']["type"]', {
              label: 'Chart Type',
              options: this._chartTypeOptions
            }),
            PropertyPaneDropdown('chartConfig[' + _i + ']["size"]', {
              label: 'Chart Size',
              options: this._chartSizeOptions
            }),
            PropertyPaneButton('chartConfig[' + _i + ']["theme"]', {
              buttonType: 0,
              text: 'Generate Theme',
              icon: 'Color',
              onClick: ((val) => {
                return new Date().valueOf();
              })
            }),
            PropertyPaneDropdown('chartConfig[' + _i + ']["url"]', {
              label: 'Chart Data Source',
              options: this.properties.siteOptions
            }),
            PropertyPaneTextField('chartConfig[' + _i + ']["dataurl"]', {
              label: 'Chart Site Url (i.e. https://contoso.sharepoint.com/path)',
              disabled: this.properties.chartConfig[_i].dataUrlDisabled
            }),
            PropertyPaneDropdown('chartConfig[' + _i + ']["list"]', {
              label: 'List Data Source',
              options: this.properties.chartConfig[_i].lists,
              disabled: this.properties.chartConfig[_i].listsDisabled
            }),
           
            PropertyPaneDropdown('chartConfig[' + _i + ']["col1"]', {
              label: 'Label Column',
              options: this.properties.chartConfig[_i].columns,
              disabled: this.properties.chartConfig[_i].colsDisabled
            }),
            PropertyPaneDropdown('chartConfig[' + _i + ']["col2"]', {
              label: 'Data Column',
              options: this.properties.chartConfig[_i].columns,
              disabled: this.properties.chartConfig[_i].colsDisabled
            }),
            PropertyPaneDropdown('chartConfig[' + _i + ']["unique"]', {
              label: 'Unique Identifier',
              options: this.properties.chartConfig[_i].columns,
              disabled: this.properties.chartConfig[_i].colsDisabled
            }),
            PropertyPaneDropdown('chartConfig[' + _i + ']["act"]', {
              label: 'Operation',
              options: this._chartColActions,
              disabled: this.properties.chartConfig[_i].colsDisabled
            })
          ]
          
        });
        
    }

    return {
      pages: [
        {
          header: {
            description: strings.PropertyPaneDescription
          },
          groups: columnPropertyOptions
        }
      ]
    };
    
  }

  protected onPropertyPaneConfigurationComplete() {
    this.render();
  }
  

  private _getSiteRootWeb(): Promise<string[]> {

    return this.context.spHttpClient.get(this.context.pageContext.web.absoluteUrl + `/_api/Site/RootWeb?$select=Title,Url`, SPHttpClient.configurations.v1)
      .then((response: SPHttpClientResponse) => {
        return response.json();
      });
  }

  private _getSites(rootWebUrl: string): Promise<ISPLists> {
    return this.context.spHttpClient.get(rootWebUrl + `/_api/web/webs?$select=Title,Url`, SPHttpClient.configurations.v1)
      .then((response: SPHttpClientResponse) => {
        return response.json();
      });
  }

  private _getListTitles(site: string): Promise<ISPLists> {
    return this.context.spHttpClient.get(site + `/_api/web/lists?$filter=Hidden eq false and BaseType eq 0`, SPHttpClient.configurations.v1)
      .then((response: SPHttpClientResponse) => {
        return response.json();
      });
  }

  private _getListColumns(listName: string, listsite: string): Promise<any> {
    return this.context.spHttpClient.get(listsite + `/_api/web/lists/GetByTitle('${listName}')/Fields?$filter=Hidden eq false and ReadOnlyField eq false  and TypeAsString ne 'User' and TypeAsString ne 'Lookup'`, SPHttpClient.configurations.v1)
      .then((response: SPHttpClientResponse) => {
        return response.json();
      });
  }
 
 
  public getData(chartConfig: Object) {
    const urlparttax = '&$select=*,TaxCatchAll/Term,TaxCatchAll/ID&$expand=TaxCatchAll';
    const resturl = `/_api/web/lists/GetByTitle(\'${chartConfig['list']}\')/items?$top=${this.properties.maxResults}&$orderby=Stamp_Name_txt desc&$limit=10&$filter=Status eq '${this.properties.dropdown}' and Year eq '${this.properties.year}'`;

    let requesturl = chartConfig['dataurl'] + resturl;

    if (!!chartConfig['hasTaxField']) {
      requesturl = requesturl + urlparttax ;
    }
    return this.context.spHttpClient.get(requesturl, SPHttpClient.configurations.v1)
      .then((response: SPHttpClientResponse) => {
        return response.json();
      });
  }

  private _updateListTitles(siteUrl: string, _chartConfig: ChartConfiguration): void {
    this._getListTitles(siteUrl).then((response) => {
      var respLists: IPropertyPaneDropdownOption[] = [];
      for (var _key in response.value) {
        respLists.push({ key: response.value[_key]['Title'], text: response.value[_key]['Title'] });
      }
      this._dropdownOptions = respLists;
      _chartConfig.lists = respLists;
      this.context.propertyPane.refresh();
    }).catch((err) => {
      this.context.statusRenderer.clearLoadingIndicator(this.domElement);
      this.context.statusRenderer.renderError(this.domElement, "There was an error loading your list, please verify the selected list has Calendar Events or choose a new list.");
    });
  }

  private _updateListColumns(siteUrl: string, listName: string, _chartConfig: ChartConfiguration): void {
    this._getListColumns(listName, siteUrl).then((response) => {
      var respLists: IFieldProperty[] = [];
      console.log(response.value);
      for (var _key in response.value) {
        respLists.push({
          key: response.value[_key]['InternalName'],
          text: response.value[_key]['Title'],
          fieldtype: response.value[_key]['TypeAsString']
        });
      }
      this._columnOptions = respLists;
      _chartConfig.columns = respLists;
      this.context.propertyPane.refresh();
    }).catch((err) => {
      this.context.statusRenderer.clearLoadingIndicator(this.domElement);
      this.context.statusRenderer.renderError(this.domElement, "There was an error loading your list, please verify the selected list has Calendar Events or choose a new list.");
    });
  }

}
