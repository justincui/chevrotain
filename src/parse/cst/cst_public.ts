import {ISimpleTokenOrIToken} from "../../scan/tokens_public"

export type CstElement = ISimpleTokenOrIToken|CstNode
export type CstChildrenDictionary = { [identifier:string]:CstElement|CstElement[] }

// TODO: docs
export interface CstNode {
    readonly name:string

    readonly childrenDictionary: CstChildrenDictionary

    readonly recoveredNode?:boolean
}

