import {forEach, map} from "../../utils/utils"
import {TokenConstructor} from "../../scan/lexer_public"
import {tokenLabel, tokenName} from "../../scan/tokens_public"

export namespace gast {

    export interface INamedProductionConstructor extends Function {
        new(definition:IProduction[], occurrenceInParent:number, name?:string):AbstractProduction
    }

    export interface INamedSepProductionConstructor extends Function {
        new(definition:IProduction[], separator:TokenConstructor, occurrenceInParent:number, name?:string):AbstractProduction
    }

    export interface IOptionallyNamedProduction {
        name?:string
    }

    export interface IProduction {
        accept(visitor:GAstVisitor):void
    }

    export interface IProductionWithOccurrence extends IProduction {
        occurrenceInParent:number
        implicitOccurrenceIndex:boolean
    }

    export abstract class AbstractProduction implements IProduction {
        public implicitOccurrenceIndex = false

        constructor(public definition:IProduction[]) {}

        accept(visitor:GAstVisitor):void {
            visitor.visit(this)
            forEach(this.definition, (prod) => {
                prod.accept(visitor)
            })
        }
    }

    export class NonTerminal extends AbstractProduction implements IProductionWithOccurrence {
        constructor(public nonTerminalName:string,
                    public referencedRule:Rule = undefined,
                    public occurrenceInParent:number = 1) { super([]) }

        set definition(definition:IProduction[]) {
            // immutable
        }

        get definition():IProduction[] {
            if (this.referencedRule !== undefined) {
                return this.referencedRule.definition
            }
            return []
        }

        accept(visitor:GAstVisitor):void {
            visitor.visit(this)
            // don't visit children of a reference, we will get cyclic infinite loops if we do so
        }
    }

    export class Rule extends AbstractProduction {
        constructor(public name:string, definition:IProduction[], public orgText:string = "") { super(definition) }
    }

    export class Flat extends AbstractProduction implements IOptionallyNamedProduction {
        // A named Flat production is used to indicate a Nested Rule in an alternation
        constructor(definition:IProduction[], public name?:string) { super(definition) }
    }

    export class Option extends AbstractProduction implements IProductionWithOccurrence, IOptionallyNamedProduction {
        constructor(definition:IProduction[], public occurrenceInParent:number = 1, public name?:string) { super(definition) }
    }

    export class RepetitionMandatory extends AbstractProduction implements IProductionWithOccurrence, IOptionallyNamedProduction {
        constructor(definition:IProduction[], public occurrenceInParent:number = 1, public name?:string) { super(definition) }
    }

    export class RepetitionMandatoryWithSeparator extends AbstractProduction
        implements IProductionWithOccurrence, IOptionallyNamedProduction {
        constructor(definition:IProduction[],
                    public separator:TokenConstructor,
                    public occurrenceInParent:number = 1,
                    public name?:string) { super(definition) }
    }

    export class Repetition extends AbstractProduction implements IProductionWithOccurrence, IOptionallyNamedProduction {
        constructor(definition:IProduction[], public occurrenceInParent:number = 1, public name?:string) { super(definition) }
    }

    export class RepetitionWithSeparator extends AbstractProduction implements IProductionWithOccurrence, IOptionallyNamedProduction {
        constructor(definition:IProduction[],
                    public separator:TokenConstructor,
                    public occurrenceInParent:number = 1,
                    public name?:string) { super(definition) }
    }

    export class Alternation extends AbstractProduction implements IProductionWithOccurrence, IOptionallyNamedProduction {
        constructor(definition:Flat[], public occurrenceInParent:number = 1, public name?:string) { super(definition) }
    }

    export class Terminal implements IProductionWithOccurrence {
        public implicitOccurrenceIndex:boolean = false

        constructor(public terminalType:TokenConstructor, public occurrenceInParent:number = 1) {}

        accept(visitor:GAstVisitor):void {
            visitor.visit(this)
        }
    }

    export abstract class GAstVisitor {

        public visit(node:IProduction):any {

            if (node instanceof NonTerminal) {
                return this.visitNonTerminal(node)
            }
            else if (node instanceof Flat) {
                return this.visitFlat(node)
            }
            else if (node instanceof Option) {
                return this.visitOption(node)
            }
            else if (node instanceof RepetitionMandatory) {
                return this.visitRepetitionMandatory(node)
            }
            else if (node instanceof RepetitionMandatoryWithSeparator) {
                return this.visitRepetitionMandatoryWithSeparator(node)
            }
            else if (node instanceof RepetitionWithSeparator) {
                return this.visitRepetitionWithSeparator(node)
            }
            else if (node instanceof Repetition) {
                return this.visitRepetition(node)
            }
            else if (node instanceof Alternation) {
                return this.visitAlternation(node)
            }
            else if (node instanceof Terminal) {
                return this.visitTerminal(node)
            }
            else if (node instanceof Rule) {
                return this.visitRule(node)
            }
            else {
                throw Error("non exhaustive match")
            }
        }

        public visitNonTerminal(node:NonTerminal):any {}

        public visitFlat(node:Flat):any {}

        public visitOption(node:Option):any {}

        public visitRepetition(node:Repetition):any {}

        public visitRepetitionMandatory(node:RepetitionMandatory):any {}

        public visitRepetitionMandatoryWithSeparator(node:RepetitionMandatoryWithSeparator):any {}

        public visitRepetitionWithSeparator(node:RepetitionWithSeparator):any {}

        public visitAlternation(node:Alternation):any {}

        public visitTerminal(node:Terminal):any {}

        public visitRule(node:Rule):any {}
    }

    export interface ISerializedGast {
        type:"NonTerminal" |
            "Flat" |
            "Option" |
            "RepetitionMandatory" |
            "RepetitionMandatoryWithSeparator" |
            "Repetition" |
            "RepetitionWithSeparator" |
            "Alternation" |
            "Terminal" |
            "Rule",

        definition?:ISerializedGast[]
    }

    export interface ISerializedGastRule extends ISerializedGast {
        name:string
    }

    export interface ISerializedNonTerminal extends ISerializedGast {
        name:string
        occurrenceInParent:number
    }

    export interface ISerializedTerminal extends ISerializedGast {
        name:string
        label?:string
        pattern?:string
        occurrenceInParent:number
    }

    export interface ISerializedTerminalWithSeparator extends ISerializedGast {
        separator:ISerializedTerminal
    }

    export function serializeGrammar(topRules:Rule[]):ISerializedGast[] {
        return map(topRules, serializeProduction)
    }


    export function serializeProduction(node:IProduction):ISerializedGast {

        function convertDefinition(definition:IProduction[]):ISerializedGast[] {
            return map(definition, serializeProduction)
        }

        if (node instanceof NonTerminal) {
            return < ISerializedNonTerminal>{
                type:               "NonTerminal",
                name:               node.nonTerminalName,
                occurrenceInParent: node.occurrenceInParent
            }
        }
        else if (node instanceof Flat) {
            return {
                type:       "Flat",
                definition: convertDefinition(node.definition)
            }
        }
        else if (node instanceof Option) {
            return {
                type:       "Option",
                definition: convertDefinition(node.definition)
            }
        }
        else if (node instanceof RepetitionMandatory) {
            return {
                type:       "RepetitionMandatory",
                definition: convertDefinition(node.definition)
            }
        }
        else if (node instanceof RepetitionMandatoryWithSeparator) {
            return < ISerializedTerminalWithSeparator>{
                type:       "RepetitionMandatoryWithSeparator",
                separator:  < ISerializedTerminal>serializeProduction(new Terminal(node.separator)),
                definition: convertDefinition(node.definition)
            }
        }
        else if (node instanceof RepetitionWithSeparator) {
            return < ISerializedTerminalWithSeparator>{
                type:       "RepetitionWithSeparator",
                separator:  < ISerializedTerminal>serializeProduction(new Terminal(node.separator)),
                definition: convertDefinition(node.definition)
            }
        }
        else if (node instanceof Repetition) {
            return {
                type:       "Repetition",
                definition: convertDefinition(node.definition)
            }
        }
        else if (node instanceof Alternation) {
            return {
                type:       "Alternation",
                definition: convertDefinition(node.definition)
            }
        }
        else if (node instanceof Terminal) {
            let serializedTerminal = < ISerializedTerminal>{
                type:               "Terminal",
                name:               tokenName(node.terminalType),
                label:              tokenLabel(node.terminalType),
                occurrenceInParent: node.occurrenceInParent
            }

            if (node.terminalType.PATTERN) {
                serializedTerminal.pattern = node.terminalType.PATTERN.source
            }

            return serializedTerminal
        }
        else if (node instanceof Rule) {
            return < ISerializedGastRule>{type: "Rule", name: node.name, definition: convertDefinition(node.definition)}
        }
        else {
            throw Error("non exhaustive match")
        }
    }

}
