define(function (require, exports, module) {
	"use strict";

	var AppInit = brackets.getModule('utils/AppInit'),
		CodeHintManager = brackets.getModule("editor/CodeHintManager"),

		JSUtils = brackets.getModule("language/JSUtils"),
		FileSystem = brackets.getModule('filesystem/FileSystem'),
		FileUtils = brackets.getModule('file/FileUtils'),
		ProjectManager = brackets.getModule('project/ProjectManager'),
		PerfUtils = brackets.getModule("utils/PerfUtils");

	/**
	 * @construtor
	 */
	function CustonCodeHint() {
		this.methods;
		this._functionRegExp = /(function\s+([$_A-Za-z\u007F-\uFFFF][$_A-Za-z0-9\u007F-\uFFFF]*)\s*(\([^)]*\)))|(([$_A-Za-z\u007F-\uFFFF][$_A-Za-z0-9\u007F-\uFFFF]*)\s*[:=]\s*function\s*(\([^)]*\)))/g;
	}

	CustonCodeHint.prototype._findAllFunctionsInText = function () {
		var rootPath = ProjectManager.getProjectRoot().fullPath,
			casperPath = FileSystem.getFileForPath(rootPath + '/modules/casper.js');

		var _this = this,
			_result;

		FileUtils.readAsText(casperPath).done(function (rawText) {
			_this.methods = _this.findAllFunctionsInText(rawText);
            //_this._getHintsFunction();
            //_this._getHintsMethods("create");
		});
	}

	CustonCodeHint.prototype.findAllFunctionsInText = function (text) {
		var results = {},
			functionName,
			params,
			match;

		PerfUtils.markStart(PerfUtils.JSUTILS_REGEXP);

		while ((match = this._functionRegExp.exec(text)) !== null) {

			functionName = (match[2] || match[5]).trim();

			if (!Array.isArray(results[functionName])) {

				params = (match[3] || match[6]).trim();

				results[functionName] = {
					offsetStart: match.index,
					params: params
				};
			}

		}

		PerfUtils.addMeasurement(PerfUtils.JSUTILS_REGEXP);

		return results;
	}

	CustonCodeHint.prototype._getHintsFunction = function () {

		var hint = [];
		for (var key in this.methods) {
			hint.push(key);
		}

		return hint;
	}

	CustonCodeHint.prototype._getHintsMethods = function (hint) {

		if (this.methods.hasOwnProperty(hint)) {
			return hint + this.methods[hint].params;
		}
        
        console.log(hint);
        
		return hint;
	}
	
	CustonCodeHint.prototype.hasHints = function (editor, implicitChar) {
        
		if (implicitChar != '.') {
			return false;
		}
        
		this.editor = editor;

		var cursor = this.editor.getCursorPos();

		var lineBeginning = {
			line: cursor.line,
			ch: 0
		};

		var textBeforeCursor = editor.document.getRange(lineBeginning, cursor);

        var match = textBeforeCursor.match(/casper[\.]*/i);
        
        if (match[0] == 'casper.'){
            return true;
        }
        
        
        return false;
        
//		return textBeforeCursor.match(/casper[\.]*/i);
	}

	CustonCodeHint.prototype.getHints = function (implicitChar) {
		return {
			hints: this._getHintsFunction(),
			match: '',
			selectInitial: true,
			handelWideResults: false
		}
	}

	CustonCodeHint.prototype.insertHint = function (hint) {
		if (!this.editor) {
			return;
		}

		var cursor = this.editor.getCursorPos();

		this.editor.document.replaceRange(this._getHintsMethods(hint), cursor);
	}

	AppInit.appReady(function () {
		var custonCodeHint = new CustonCodeHint();
		custonCodeHint._findAllFunctionsInText();

		CodeHintManager.registerHintProvider(custonCodeHint, ["all"], 9);
	});
});
