/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the Source EULA. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { ExecutionPlanPropertiesViewBase, PropertiesSortType } from 'sql/workbench/contrib/executionPlan/browser/executionPlanPropertiesViewBase';
import { IThemeService } from 'vs/platform/theme/common/themeService';
import type * as azdata from 'azdata';
import { localize } from 'vs/nls';
import { textFormatter } from 'sql/base/browser/ui/table/formatters';
import { isString } from 'vs/base/common/types';
import { removeLineBreaks } from 'sql/base/common/strings';
import * as DOM from 'vs/base/browser/dom';
import { InternalExecutionPlanElement, InternalExecutionPlanNode } from 'sql/workbench/contrib/executionPlan/browser/azdataGraphView';

export class ExecutionPlanComparisonPropertiesView extends ExecutionPlanPropertiesViewBase {
	private _model: ExecutionPlanComparisonPropertiesViewModel;
	private _topOperationName: HTMLElement;
	private _bottomOperationName: HTMLElement;

	public constructor(
		parentContainer: HTMLElement,
		themeService: IThemeService,
	) {
		super(parentContainer, themeService);
		this._model = <ExecutionPlanComparisonPropertiesViewModel>{};
		this._parentContainer.style.display = 'none';
		const header = DOM.$('.compare-operation-name');
		this._topOperationName = DOM.$('.compare-operation-name-text');
		header.appendChild(this._topOperationName);
		this._bottomOperationName = DOM.$('.compare-operation-name-text');
		header.appendChild(this._bottomOperationName);
		this.setHeader(header);
	}


	public setTopElement(e: InternalExecutionPlanElement): void {
		this._model.topElement = e;
		let target;
		if ((<InternalExecutionPlanNode>e)?.name) {
			target = removeLineBreaks((<InternalExecutionPlanNode>e).name);
		} else {
			target = localize('executionPlanPropertiesEdgeOperationName', "Edge");
		}
		const titleText = localize('executionPlanComparisonPropertiesTopOperation', "Top operation: {0}", target);
		this._topOperationName.innerText = titleText;
		this._bottomOperationName.title = titleText;
		this.renderView();
	}

	public setBottomElement(e: InternalExecutionPlanElement): void {
		this._model.bottomElement = e;
		let target;
		if ((<InternalExecutionPlanNode>e)?.name) {
			target = removeLineBreaks((<InternalExecutionPlanNode>e).name);
		} else {
			target = localize('executionPlanPropertiesEdgeOperationName', "Edge");
		}

		const titleText = localize('executionPlanComparisonPropertiesBottomOperation', "Bottom operation: {0}", target);
		this._bottomOperationName.innerText = titleText;
		this._bottomOperationName.title = titleText;
		this.renderView();
	}


	public renderView() {
		const columns: Slick.Column<Slick.SlickData>[] = [
			{
				id: 'name',
				name: localize('nodePropertyViewNameNameColumnHeader', "Name"),
				field: 'name',
				width: 200,
				editor: Slick.Editors.Text,
				headerCssClass: 'prop-table-header',
				formatter: textFormatter
			},
			{
				id: 'value',
				name: localize('nodePropertyViewNameValueColumnTopHeader', "Value (Top Plan)"),
				field: 'value1',
				width: 150,
				editor: Slick.Editors.Text,
				headerCssClass: 'prop-table-header',
				formatter: textFormatter
			},
			{
				id: 'value',
				name: localize('nodePropertyViewNameValueColumnBottomHeader', "Value (Bottom Plan)"),
				field: 'value2',
				width: 150,
				editor: Slick.Editors.Text,
				headerCssClass: 'prop-table-header',
				formatter: textFormatter
			}
		];

		let topProps = [];
		let bottomProps = [];
		if (this._model.topElement?.properties) {
			topProps = this._model.topElement.properties;
		}
		if (this._model.bottomElement?.properties) {
			bottomProps = this._model.bottomElement.properties;
		}

		this.populateTable(columns, this.convertPropertiesToTableRows(topProps, bottomProps, -1, 0));
	}

	public sortPropertiesAlphabetically(props: Map<string, TablePropertiesMapEntry>): Map<string, TablePropertiesMapEntry> {
		return new Map([...props.entries()].sort((a, b) => {
			if (!a[1]?.name && !b[1]?.name) {
				return 0;
			} else if (!a[1]?.name) {
				return -1;
			} else if (!b[1]?.name) {
				return 1;
			} else {
				return a[1].name.localeCompare(b[1].name);
			}
		}));
	}

	public sortPropertiesByImportance(props: Map<string, TablePropertiesMapEntry>): Map<string, TablePropertiesMapEntry> {
		return new Map([...props.entries()].sort((a, b) => {
			if (!a[1]?.displayOrder && !b[1]?.displayOrder) {
				return 0;
			} else if (!a[1]?.displayOrder) {
				return -1;
			} else if (!b[1]?.displayOrder) {
				return 1;
			} else {
				return a[1].displayOrder - b[1].displayOrder;
			}
		}));
	}

	public sortPropertiesReverseAlphabetically(props: Map<string, TablePropertiesMapEntry>): Map<string, TablePropertiesMapEntry> {
		return new Map([...props.entries()].sort((a, b) => {
			if (!a[1]?.displayOrder && !b[1]?.displayOrder) {
				return 0;
			} else if (!a[1]?.displayOrder) {
				return -1;
			} else if (!b[1]?.displayOrder) {
				return 1;
			} else {
				return b[1].displayOrder - a[1].displayOrder;
			}
		}));
	}

	private convertPropertiesToTableRows(topNode: azdata.executionPlan.ExecutionPlanGraphElementProperty[], bottomNode: azdata.executionPlan.ExecutionPlanGraphElementProperty[], parentIndex: number, indent: number, rows: { [key: string]: string }[] = []): { [key: string]: string }[] {
		let propertiesMap: Map<string, TablePropertiesMapEntry> = new Map();

		if (topNode) {
			topNode.forEach(p => {
				propertiesMap.set(p.name, {
					topProp: p,
					bottomProp: undefined,
					displayOrder: p.displayOrder,
					name: p.name
				});
			});
		}

		if (bottomNode) {
			bottomNode.forEach(p => {
				if (propertiesMap.has(p.name)) {
					propertiesMap.get(p.name).bottomProp = p;
				} else {
					propertiesMap.set(p.name, {
						topProp: undefined,
						bottomProp: p,
						displayOrder: p.displayOrder,
						name: p.name
					});
				}
			});
		}

		switch (this.sortType) {
			case PropertiesSortType.DisplayOrder:
				propertiesMap = this.sortPropertiesByImportance(propertiesMap);
				break;
			case PropertiesSortType.Alphabetical:
				propertiesMap = this.sortPropertiesAlphabetically(propertiesMap);
				break;
			case PropertiesSortType.ReverseAlphabetical:
				propertiesMap = this.sortPropertiesReverseAlphabetically(propertiesMap);
				break;
		}

		propertiesMap.forEach((v, k) => {
			let row = {};
			row['name'] = '  '.repeat(indent) + k;
			row['parent'] = parentIndex;

			const topProp = v.topProp;
			const bottomProp = v.bottomProp;

			if (topProp && bottomProp) {
				row['displayOrder'] = v.topProp.displayOrder;
				row['value1'] = removeLineBreaks(v.topProp.displayValue, ' ');
				row['value2'] = removeLineBreaks(v.bottomProp.displayValue, ' ');
				rows.push(row);
				if (!isString(topProp.value) && !isString(bottomProp.value)) {
					this.convertPropertiesToTableRows(topProp.value, bottomProp.value, rows.length - 1, indent + 2, rows);
				} else if (isString(topProp?.value) && !isString(bottomProp.value)) {
					this.convertPropertiesToTableRows(undefined, bottomProp.value, rows.length - 1, indent + 2, rows);
				} else if (!isString(topProp.value) && !isString(bottomProp.value)) {
					this.convertPropertiesToTableRows(topProp.value, undefined, rows.length - 1, indent + 2, rows);
				}
			} else if (topProp && !bottomProp) {
				row['displayOrder'] = v.topProp.displayOrder;
				row['value1'] = v.topProp.displayValue;
				rows.push(row);
				if (!isString(topProp.value)) {
					this.convertPropertiesToTableRows(topProp.value, undefined, rows.length - 1, indent + 2, rows);
				}
			} else if (!topProp && bottomProp) {
				row['displayOrder'] = v.bottomProp.displayOrder;
				row['value2'] = v.bottomProp.displayValue;
				rows.push(row);
				if (!isString(bottomProp.value)) {
					this.convertPropertiesToTableRows(undefined, bottomProp.value, rows.length - 1, indent + 2, rows);
				}
			}

		});
		return rows;
	}
}

export interface ExecutionPlanComparisonPropertiesViewModel {
	topElement: InternalExecutionPlanElement,
	bottomElement: InternalExecutionPlanElement
}

interface TablePropertiesMapEntry {
	topProp: azdata.executionPlan.ExecutionPlanGraphElementProperty,
	bottomProp: azdata.executionPlan.ExecutionPlanGraphElementProperty,
	displayOrder: number,
	name: string
}